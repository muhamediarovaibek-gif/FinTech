from pathlib import Path
import json
import uuid

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    average_precision_score,
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline


# --------------------------------------------------
# 1. Основные пути
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

DEFAULT_DATA_PATH = (
    BASE_DIR
    / "data"
    / "raw"
    / "transactions.csv"
)

MODELS_DIR = BASE_DIR / "models"

CANDIDATES_DIR = (
    MODELS_DIR
    / "candidates"
)

CANDIDATES_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# --------------------------------------------------
# 2. Признаки и Target
# --------------------------------------------------

FEATURES = [
    "amount",
    "hour",
    "new_device",
    "foreign_country",
    "transactions_last_hour",
]

TARGET = "fraud"


# --------------------------------------------------
# 3. Стоимость ошибок
# --------------------------------------------------

# Пока условные значения для нашего проекта.
# Позже можно заменить на реальные бизнес-значения.

FP_COST = 100
FN_COST = 1000


# --------------------------------------------------
# 4. Thresholds
# --------------------------------------------------

# Проверяем значения:
# 0.01, 0.02, ..., 0.99

THRESHOLDS = [
    value / 100
    for value in range(1, 100)
]


# --------------------------------------------------
# 5. Загрузка датасета
# --------------------------------------------------

def load_dataset(
    dataset_path,
):
    dataset_path = Path(
        dataset_path
    )

    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset not found: "
            f"{dataset_path}"
        )

    suffix = (
        dataset_path
        .suffix
        .lower()
    )

    if suffix == ".csv":
        return pd.read_csv(
            dataset_path
        )

    if suffix == ".xlsx":
        return pd.read_excel(
            dataset_path
        )

    raise ValueError(
        "Only .csv and .xlsx "
        "datasets are supported"
    )


# --------------------------------------------------
# 6. Расчёт Business Loss
# --------------------------------------------------

def calculate_business_loss(
    y_true,
    y_proba,
    threshold,
    fp_cost=FP_COST,
    fn_cost=FN_COST,
):
    y_pred = (
        y_proba >= threshold
    ).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_true,
        y_pred,
        labels=[0, 1],
    ).ravel()

    loss = (
        fp * fp_cost
        + fn * fn_cost
    )

    return (
        int(loss),
        int(fp),
        int(fn),
    )


# --------------------------------------------------
# 7. Поиск лучшего Threshold
# --------------------------------------------------

def find_best_threshold(
    y_true,
    y_proba,
):
    best_threshold = None
    best_loss = float("inf")

    for threshold in THRESHOLDS:

        loss, fp, fn = (
            calculate_business_loss(
                y_true=y_true,
                y_proba=y_proba,
                threshold=threshold,
            )
        )

        if loss < best_loss:
            best_loss = loss
            best_threshold = threshold

    return (
        float(best_threshold),
        int(best_loss),
    )


# --------------------------------------------------
# 8. Расчёт метрик
# --------------------------------------------------

def calculate_metrics(
    y_true,
    y_pred,
    y_proba,
):
    tn, fp, fn, tp = confusion_matrix(
        y_true,
        y_pred,
        labels=[0, 1],
    ).ravel()

    report = classification_report(
        y_true,
        y_pred,
        labels=[0, 1],
        output_dict=True,
        zero_division=0,
    )

    pr_auc = average_precision_score(
        y_true,
        y_proba,
    )

    return {
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },

        "precision": float(
            report["1"]["precision"]
        ),

        "recall": float(
            report["1"]["recall"]
        ),

        "f1": float(
            report["1"]["f1-score"]
        ),

        "pr_auc": float(
            pr_auc
        ),
    }


# --------------------------------------------------
# 9. Расчёт Business Loss
#    на готовых Prediction
# --------------------------------------------------

def calculate_test_loss(
    y_true,
    y_pred,
):
    tn, fp, fn, tp = confusion_matrix(
        y_true,
        y_pred,
        labels=[0, 1],
    ).ravel()

    loss = (
        fp * FP_COST
        + fn * FN_COST
    )

    return int(loss)


# --------------------------------------------------
# 10. Создание Baseline Model
# --------------------------------------------------

def create_baseline_model():
    return Pipeline(
        [
            (
                "scaler",
                StandardScaler(),
            ),
            (
                "classifier",
                LogisticRegression(
                    random_state=42,
                    max_iter=1000,
                ),
            ),
        ]
    )


# --------------------------------------------------
# 11. Создание Balanced Model
# --------------------------------------------------

def create_balanced_model():
    return Pipeline(
        [
            (
                "scaler",
                StandardScaler(),
            ),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced",
                    random_state=42,
                    max_iter=1000,
                ),
            ),
        ]
    )


# --------------------------------------------------
# 12. Основная функция обучения
# --------------------------------------------------

def train_models(
    dataset_path,
):
    # ----------------------------------------------
    # 12.1. Загружаем датасет
    # ----------------------------------------------

    data = load_dataset(
        dataset_path
    )

    # ----------------------------------------------
    # 12.2. Получаем X и y
    # ----------------------------------------------

    X = data[FEATURES]
    y = data[TARGET]

    # ----------------------------------------------
    # 12.3. Train / Temp
    #
    # 60% Train
    # 40% Temp
    # ----------------------------------------------

    (
        X_train,
        X_temp,
        y_train,
        y_temp,
    ) = train_test_split(
        X,
        y,
        test_size=0.4,
        random_state=42,
        stratify=y,
    )

    # ----------------------------------------------
    # 12.4. Validation / Test
    #
    # Temp = 40%
    #
    # 20% Validation
    # 20% Test
    # ----------------------------------------------

    (
        X_val,
        X_test,
        y_val,
        y_test,
    ) = train_test_split(
        X_temp,
        y_temp,
        test_size=0.5,
        random_state=42,
        stratify=y_temp,
    )

    # ----------------------------------------------
    # 12.5. Создаём модели
    # ----------------------------------------------

    baseline_model = (
        create_baseline_model()
    )

    balanced_model = (
        create_balanced_model()
    )

    # ----------------------------------------------
    # 12.6. Обучаем модели
    #
    # Только Train!
    # ----------------------------------------------

    baseline_model.fit(
        X_train,
        y_train,
    )

    balanced_model.fit(
        X_train,
        y_train,
    )

    # ----------------------------------------------
    # 12.7. Получаем вероятности
    #       на Validation
    # ----------------------------------------------

    baseline_val_proba = (
        baseline_model
        .predict_proba(
            X_val
        )[:, 1]
    )

    balanced_val_proba = (
        balanced_model
        .predict_proba(
            X_val
        )[:, 1]
    )

    # ----------------------------------------------
    # 12.8. Ищем Threshold
    #
    # Threshold выбирается
    # ТОЛЬКО на Validation.
    # ----------------------------------------------

    (
        baseline_threshold,
        baseline_val_loss,
    ) = find_best_threshold(
        y_val,
        baseline_val_proba,
    )

    (
        balanced_threshold,
        balanced_val_loss,
    ) = find_best_threshold(
        y_val,
        balanced_val_proba,
    )

    # ----------------------------------------------
    # 12.9. Получаем вероятности
    #       на Test
    # ----------------------------------------------

    baseline_test_proba = (
        baseline_model
        .predict_proba(
            X_test
        )[:, 1]
    )

    balanced_test_proba = (
        balanced_model
        .predict_proba(
            X_test
        )[:, 1]
    )

    # ----------------------------------------------
    # 12.10. Prediction на Test
    #
    # Используем Threshold,
    # найденный на Validation.
    # ----------------------------------------------

    baseline_test_pred = (
        baseline_test_proba
        >= baseline_threshold
    ).astype(int)

    balanced_test_pred = (
        balanced_test_proba
        >= balanced_threshold
    ).astype(int)

    # ----------------------------------------------
    # 12.11. Метрики Test
    # ----------------------------------------------

    baseline_metrics = (
        calculate_metrics(
            y_test,
            baseline_test_pred,
            baseline_test_proba,
        )
    )

    balanced_metrics = (
        calculate_metrics(
            y_test,
            balanced_test_pred,
            balanced_test_proba,
        )
    )

    # ----------------------------------------------
    # 12.12. Business Loss на Test
    # ----------------------------------------------

    baseline_test_loss = (
        calculate_test_loss(
            y_test,
            baseline_test_pred,
        )
    )

    balanced_test_loss = (
        calculate_test_loss(
            y_test,
            balanced_test_pred,
        )
    )

    # ----------------------------------------------
    # 12.13. Создаём Training ID
    # ----------------------------------------------

    training_id = (
        uuid.uuid4()
        .hex[:8]
    )

    training_dir = (
        CANDIDATES_DIR
        / training_id
    )

    training_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    background_path = (
        training_dir
        / "background.csv"
    )

    X_train.to_csv(
        background_path,
        index=False,
    )

    # ----------------------------------------------
    # 12.14. Сохраняем Candidate Models
    # ----------------------------------------------

    baseline_model_path = (
        training_dir
        / "baseline.pkl"
    )

    balanced_model_path = (
        training_dir
        / "balanced.pkl"
    )

    joblib.dump(
        baseline_model,
        baseline_model_path,
    )

    joblib.dump(
        balanced_model,
        balanced_model_path,
    )

    # ----------------------------------------------
    # 12.15. Сохраняем Thresholds
    # ----------------------------------------------

    thresholds_data = {
        "baseline": (
            baseline_threshold
        ),
        "balanced": (
            balanced_threshold
        ),
    }

    thresholds_path = (
        training_dir
        / "thresholds.json"
    )

    with open(
        thresholds_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            thresholds_data,
            file,
            indent=4,
        )

    # ----------------------------------------------
    # 12.16. Формируем результат
    # ----------------------------------------------

    result = {
        "training_id": training_id,

        "dataset": {
            "rows": int(
                len(data)
            ),
            "train_rows": int(
                len(X_train)
            ),
            "validation_rows": int(
                len(X_val)
            ),
            "test_rows": int(
                len(X_test)
            ),
        },

        "baseline": {
            "threshold": (
                baseline_threshold
            ),

            "validation_loss": (
                baseline_val_loss
            ),

            "test_loss": (
                baseline_test_loss
            ),

            "metrics": (
                baseline_metrics
            ),
        },

        "balanced": {
            "threshold": (
                balanced_threshold
            ),

            "validation_loss": (
                balanced_val_loss
            ),

            "test_loss": (
                balanced_test_loss
            ),

            "metrics": (
                balanced_metrics
            ),
        },
    }


    # --------------------------------------------------
    # 12.17. Сохраняем Metrics
    # --------------------------------------------------

    metrics_path = (
        training_dir
        / "metrics.json"
    )

    with open(
        metrics_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            result,
            file,
            indent=4,
        )

    return result


# --------------------------------------------------
# 13. Ручной запуск train.py
# --------------------------------------------------

if __name__ == "__main__":

    result = train_models(
        DEFAULT_DATA_PATH
    )

    print(
        "\n"
        + "=" * 60
    )

    print(
        "TRAINING COMPLETED"
    )

    print(
        "=" * 60
    )

    print(
        json.dumps(
            result,
            indent=4,
        )
    )