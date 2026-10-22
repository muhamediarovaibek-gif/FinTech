from pathlib import Path

import pandas as pd
import shap


# --------------------------------------------------
# Пути
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

ACTIVE_BACKGROUND_PATH = (
    BASE_DIR
    / "models"
    / "active"
    / "background.csv"
)


# --------------------------------------------------
# Признаки модели
# --------------------------------------------------

FEATURES = [
    "amount",
    "hour",
    "new_device",
    "foreign_country",
    "transactions_last_hour",
]


# --------------------------------------------------
# Загрузка Background Dataset
# --------------------------------------------------

def load_background_data():
    if not ACTIVE_BACKGROUND_PATH.exists():
        raise FileNotFoundError(
            "Active background data not found"
        )

    background_data = pd.read_csv(
        ACTIVE_BACKGROUND_PATH
    )

    background_data = (
        background_data[FEATURES]
    )

    return background_data


# --------------------------------------------------
# Объяснение транзакции
# --------------------------------------------------

def explain_transaction(
    model,
    amount,
    hour,
    new_device,
    foreign_country,
    transactions_last_hour,
):
    # ----------------------------------------------
    # Background data
    # ----------------------------------------------

    background_data = (
        load_background_data()
    )


    # ----------------------------------------------
    # Получаем части Pipeline
    # ----------------------------------------------

    scaler = model.named_steps[
        "scaler"
    ]

    classifier = model.named_steps[
        "classifier"
    ]


    # ----------------------------------------------
    # Масштабируем Background
    # ----------------------------------------------

    background_scaled = (
        scaler.transform(
            background_data
        )
    )


    # ----------------------------------------------
    # Создаём SHAP Explainer
    # ----------------------------------------------

    explainer = shap.LinearExplainer(
        classifier,
        background_scaled,
    )


    # ----------------------------------------------
    # Создаём транзакцию
    # ----------------------------------------------

    transaction = pd.DataFrame([{
        "amount": amount,
        "hour": hour,
        "new_device": new_device,
        "foreign_country": foreign_country,
        "transactions_last_hour": transactions_last_hour,
    }])

    transaction = transaction[
        FEATURES
    ]


    # ----------------------------------------------
    # Масштабируем транзакцию
    # ----------------------------------------------

    transaction_scaled = (
        scaler.transform(
            transaction
        )
    )


    # ----------------------------------------------
    # Получаем SHAP values
    # ----------------------------------------------

    shap_values = explainer(
        transaction_scaled
    )

    values = shap_values.values[0]


    # ----------------------------------------------
    # Формируем объяснение
    # ----------------------------------------------

    explanation = []

    for feature, value in zip(
        FEATURES,
        values,
    ):
        explanation.append({
            "feature": feature,
            "impact": float(value),
            "direction": (
                "FRAUD"
                if value > 0
                else "NORMAL"
            ),
        })


    # ----------------------------------------------
    # Сортируем по силе влияния
    # ----------------------------------------------

    explanation.sort(
        key=lambda item: abs(
            item["impact"]
        ),
        reverse=True,
    )

    return explanation