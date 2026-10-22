from ml.src.explain import explain_transaction
from pathlib import Path
import json

import joblib
import pandas as pd


# --------------------------------------------------
# Пути
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

ACTIVE_DIR = (
    BASE_DIR
    / "models"
    / "active"
)

ACTIVE_MODEL_PATH = (
    ACTIVE_DIR
    / "model.pkl"
)

ACTIVE_CONFIG_PATH = (
    ACTIVE_DIR
    / "config.json"
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
# Константы Risk Scoring
# --------------------------------------------------

LOW_RISK_THRESHOLD = 300
HIGH_RISK_THRESHOLD = 700


# --------------------------------------------------
# Расчёт Risk Score
# --------------------------------------------------

def calculate_risk_score(
    fraud_probability,
):
    risk_score = round(
        fraud_probability * 1000
    )

    return risk_score


# --------------------------------------------------
# Определение Risk Level
# --------------------------------------------------

def get_risk_level(
    risk_score,
):
    if risk_score < LOW_RISK_THRESHOLD:
        return "LOW"

    if risk_score < HIGH_RISK_THRESHOLD:
        return "MEDIUM"

    return "HIGH"


# --------------------------------------------------
# Decision Engine
# --------------------------------------------------

def make_decision(
    risk_score,
):
    if risk_score < LOW_RISK_THRESHOLD:
        return "ALLOW"

    if risk_score < HIGH_RISK_THRESHOLD:
        return "REVIEW"

    return "BLOCK"


# --------------------------------------------------
# Загрузка Active Model
# --------------------------------------------------

def load_active_model():
    if not ACTIVE_MODEL_PATH.exists():
        raise FileNotFoundError(
            "Active model not found"
        )

    if not ACTIVE_CONFIG_PATH.exists():
        raise FileNotFoundError(
            "Active model config not found"
        )

    model = joblib.load(
        ACTIVE_MODEL_PATH
    )

    with open(
        ACTIVE_CONFIG_PATH,
        "r",
        encoding="utf-8",
    ) as file:
        config = json.load(file)

    return model, config


# --------------------------------------------------
# Предсказание транзакции
# --------------------------------------------------

def predict_transaction(
    amount,
    hour,
    new_device,
    foreign_country,
    transactions_last_hour,
):
    # Загружаем текущую активную модель
    model, config = load_active_model()

    # Формируем транзакцию
    transaction = pd.DataFrame([{
        "amount": amount,
        "hour": hour,
        "new_device": new_device,
        "foreign_country": foreign_country,
        "transactions_last_hour": transactions_last_hour,
    }])

    # Фиксируем порядок признаков
    transaction = transaction[FEATURES]

    # Получаем вероятность Fraud
    probability = float(
        model.predict_proba(
            transaction
        )[0][1]
    )

    # Threshold активной модели
    threshold = float(
        config["threshold"]
    )

    # Бинарный прогноз
    prediction = (
        "FRAUD"
        if probability >= threshold
        else "NORMAL"
    )

    # Risk Score
    risk_score = calculate_risk_score(
        probability
    )

    # Risk Level
    risk_level = get_risk_level(
        risk_score
    )

    # Business Decision
    decision = make_decision(
        risk_score
    )

    explanation = explain_transaction(
        model=model,
        amount=amount,
        hour=hour,
        new_device=new_device,
        foreign_country=foreign_country,
        transactions_last_hour=transactions_last_hour,
    )

    return {
        "training_id": config[
            "training_id"
        ],
        "model_type": config[
            "model_type"
        ],
        "probability": probability,
        "threshold": threshold,
        "prediction": prediction,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "decision": decision,
        "explanation": explanation,
    }


# --------------------------------------------------
# Локальное тестирование
# --------------------------------------------------

if __name__ == "__main__":

    transaction = {
        "amount": 50,
        "hour": 14,
        "new_device": 0,
        "foreign_country": 0,
        "transactions_last_hour": 1,
    }

    result = predict_transaction(
        **transaction
    )

    print("\nTransaction:")

    print(
        f"Amount: "
        f"{transaction['amount']}"
    )

    print(
        f"Hour: "
        f"{transaction['hour']}"
    )

    print(
        f"New device: "
        f"{transaction['new_device']}"
    )

    print(
        f"Foreign country: "
        f"{transaction['foreign_country']}"
    )

    print(
        f"Transactions last hour: "
        f"{transaction['transactions_last_hour']}"
    )


    print("\nACTIVE MODEL")

    print(
        f"Training ID: "
        f"{result['training_id']}"
    )

    print(
        f"Model type: "
        f"{result['model_type']}"
    )

    print(
        f"Fraud probability: "
        f"{result['probability']:.2%}"
    )

    print(
        f"Threshold: "
        f"{result['threshold']:.2f}"
    )

    print(
        f"Prediction: "
        f"{result['prediction']}"
    )

    print(
        f"Risk Score: "
        f"{result['risk_score']} / 1000"
    )

    print(
        f"Risk Level: "
        f"{result['risk_level']}"
    )

    print(
        f"Decision: "
        f"{result['decision']}"
    )
    
    print("\nExplanation:")

    for item in result["explanation"]:
        print(
            f"{item['feature']}: "
            f"{item['impact']:.4f} "
            f"→ {item['direction']}"
        )