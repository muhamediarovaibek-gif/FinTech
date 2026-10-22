import io
import json
import shutil
import uuid

from pathlib import Path
from typing import Literal

import pandas as pd

from fastapi import (
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field

from ml.src.predict import predict_transaction
from ml.src.train import train_models
from backend.services.dataset_validator import validate_dataset


# --------------------------------------------------
# FastAPI
# --------------------------------------------------

app = FastAPI(
    title="Fraud Detection API",
    version="1.0.0",
)


# --------------------------------------------------
# CORS Middleware
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Пути
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = (
    BASE_DIR / "backend" / "uploads"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

CANDIDATES_DIR = (
    BASE_DIR
    / "ml"
    / "models"
    / "candidates"
)

ACTIVE_DIR = (
    BASE_DIR
    / "ml"
    / "models"
    / "active"
)

ACTIVE_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# --------------------------------------------------
# Валидация датасета
# --------------------------------------------------

def find_dataset_file(
    dataset_id: str,
):
    for suffix in [".csv", ".xlsx"]:

        file_path = (
            UPLOAD_DIR
            / f"{dataset_id}{suffix}"
        )

        if file_path.exists():
            return file_path

    return None


# --------------------------------------------------
# Схема транзакции
# --------------------------------------------------

class TransactionRequest(BaseModel):
    amount: float = Field(
        ge=0
    )

    hour: int = Field(
        ge=0,
        le=23
    )

    new_device: Literal[0, 1]

    foreign_country: Literal[0, 1]

    transactions_last_hour: int = Field(
        ge=0
    )


# --------------------------------------------------
# Схема обучения
# --------------------------------------------------

class TrainRequest(BaseModel):
    dataset_id: str


# --------------------------------------------------
# Схема активации модели
# --------------------------------------------------

class ActivateModelRequest(BaseModel):
    training_id: str
    model_type: Literal[
        "baseline",
        "balanced",
    ]


# --------------------------------------------------
# Проверка Backend
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Fraud Detection API is running"
    }


# --------------------------------------------------
# Анализ транзакции
# --------------------------------------------------

@app.post("/api/analyze")
def analyze_transaction(
    transaction: TransactionRequest,
):
    try:
        result = predict_transaction(
            amount=transaction.amount,
            hour=transaction.hour,
            new_device=transaction.new_device,
            foreign_country=transaction.foreign_country,
            transactions_last_hour=transaction.transactions_last_hour,
        )

        return result

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )


# --------------------------------------------------
# Загрузка датасета
# --------------------------------------------------

@app.post("/api/datasets")
async def upload_dataset(
    file: UploadFile = File(...)
):
    # ----------------------------------------------
    # 1. Проверяем имя
    # ----------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is missing",
        )

    # ----------------------------------------------
    # 2. Проверяем расширение
    # ----------------------------------------------

    suffix = Path(
        file.filename
    ).suffix.lower()

    if suffix not in [".csv", ".xlsx"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only .csv and .xlsx files "
                "are supported"
            ),
        )

    # ----------------------------------------------
    # 3. Читаем файл
    # ----------------------------------------------

    contents = await file.read()

    try:
        if suffix == ".csv":
            data = pd.read_csv(
                io.BytesIO(contents)
            )

        else:
            data = pd.read_excel(
                io.BytesIO(contents)
            )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not read dataset: "
                f"{error}"
            ),
        )

    # ----------------------------------------------
    # 4. Проверяем датасет
    # ----------------------------------------------

    validation_errors = validate_dataset(
        data
    )

    if validation_errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Dataset validation failed",
                "errors": validation_errors,
            },
        )

    # ----------------------------------------------
    # 5. Статистика
    # ----------------------------------------------

    normal_count = int(
        (data["fraud"] == 0).sum()
    )

    fraud_count = int(
        (data["fraud"] == 1).sum()
    )

    total_count = len(data)

    fraud_rate = (
        fraud_count / total_count
        if total_count > 0
        else 0
    )

    # ----------------------------------------------
    # 6. Генерируем ID
    # ----------------------------------------------

    dataset_id = uuid.uuid4().hex[:8]

    safe_filename = (
        f"{dataset_id}{suffix}"
    )

    file_path = (
        UPLOAD_DIR / safe_filename
    )

    # ----------------------------------------------
    # 7. Сохраняем
    # ----------------------------------------------

    with open(
        file_path,
        "wb",
    ) as saved_file:
        saved_file.write(
            contents
        )

    # ----------------------------------------------
    # 8. Ответ
    # ----------------------------------------------

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "stored_filename": safe_filename,
        "rows": total_count,
        "columns": data.columns.tolist(),
        "normal_count": normal_count,
        "fraud_count": fraud_count,
        "fraud_rate": fraud_rate,
        "status": "Dataset uploaded successfully",
    }


# --------------------------------------------------
# Схема обучения
# --------------------------------------------------

@app.post("/api/train")
def train_new_model(
    request: TrainRequest,
):
    dataset_path = find_dataset_file(
        request.dataset_id
    )

    if dataset_path is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    try:
        result = train_models(
            dataset_path
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Training failed: {error}",
        )

    return result


# --------------------------------------------------
# Проверка training_id
# --------------------------------------------------

def is_valid_training_id(
    training_id: str,
):
    if len(training_id) != 8:
        return False

    return all(
        character in "0123456789abcdef"
        for character in training_id
    )


# --------------------------------------------------
# Поиск кандидата
# --------------------------------------------------

def get_candidate_dir(
    training_id: str,
):
    if not is_valid_training_id(
        training_id
    ):
        return None

    candidate_dir = (
        CANDIDATES_DIR
        / training_id
    )

    if not candidate_dir.exists():
        return None

    if not candidate_dir.is_dir():
        return None

    return candidate_dir


# --------------------------------------------------
# Получение кандидата
# --------------------------------------------------

@app.get(
    "/api/candidates/{training_id}"
)
def get_candidate(
    training_id: str,
):
    candidate_dir = get_candidate_dir(
        training_id
    )

    if candidate_dir is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    metrics_path = (
        candidate_dir
        / "metrics.json"
    )

    if not metrics_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Candidate metrics not found",
        )

    try:
        with open(
            metrics_path,
            "r",
            encoding="utf-8",
        ) as file:
            metrics = json.load(
                file
            )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not read candidate metrics",
        )

    return metrics


# --------------------------------------------------
# Активация модели
# --------------------------------------------------

@app.post("/api/activate")
def activate_model(
    request: ActivateModelRequest,
):
    candidate_dir = get_candidate_dir(
        request.training_id
    )

    if candidate_dir is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    model_path = (
        candidate_dir
        / f"{request.model_type}.pkl"
    )

    background_path = (
        candidate_dir
        / "background.csv"
    )

    if not background_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Candidate background data not found",
        )

    thresholds_path = (
        candidate_dir
        / "thresholds.json"
    )

    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Candidate model not found",
        )

    if not thresholds_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Candidate thresholds not found",
        )

    try:
        with open(
            thresholds_path,
            "r",
            encoding="utf-8",
        ) as file:
            thresholds = json.load(file)

        threshold = thresholds[
            request.model_type
        ]

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not read candidate threshold",
        )

    active_model_path = (
        ACTIVE_DIR
        / "model.pkl"
    )

    shutil.copy2(
        model_path,
        active_model_path,
    )

    active_background_path = (
        ACTIVE_DIR
        / "background.csv"
    )

    shutil.copy2(
        background_path,
        active_background_path,
    )

    config = {
        "training_id": request.training_id,
        "model_type": request.model_type,
        "threshold": threshold,
    }

    config_path = (
        ACTIVE_DIR
        / "config.json"
    )

    with open(
        config_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            config,
            file,
            indent=4,
        )

    return {
        "status": "Model activated successfully",
        "active_model": config,
    }