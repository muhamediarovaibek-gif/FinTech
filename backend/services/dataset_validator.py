import pandas as pd


REQUIRED_COLUMNS = [
    "amount",
    "hour",
    "new_device",
    "foreign_country",
    "transactions_last_hour",
    "fraud",
]


def validate_dataset(
    data: pd.DataFrame,
):
    errors = []

    # ----------------------------------------------
    # 1. Проверяем, что датасет не пустой
    # ----------------------------------------------

    if data.empty:
        errors.append(
            "Dataset is empty"
        )

        return errors

    # ----------------------------------------------
    # 2. Проверяем необходимые колонки
    # ----------------------------------------------

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in data.columns
    ]

    if missing_columns:
        errors.append(
            "Missing required columns: "
            + ", ".join(missing_columns)
        )

        return errors

    # ----------------------------------------------
    # 3. Проверяем пропуски
    # ----------------------------------------------

    for column in REQUIRED_COLUMNS:

        missing_count = int(
            data[column].isna().sum()
        )

        if missing_count > 0:
            errors.append(
                f"{column}: "
                f"{missing_count} missing values"
            )

    # ----------------------------------------------
    # 4. Проверяем числовые значения
    # ----------------------------------------------

    for column in REQUIRED_COLUMNS:

        if not pd.api.types.is_numeric_dtype(
            data[column]
        ):
            errors.append(
                f"{column} must be numeric"
            )

    # Если есть проблемы с типами,
    # дальнейшие сравнения могут вызвать ошибки.
    if errors:
        return errors

    # ----------------------------------------------
    # 5. amount
    # ----------------------------------------------

    if (data["amount"] < 0).any():
        errors.append(
            "amount cannot contain "
            "negative values"
        )

    # ----------------------------------------------
    # 6. hour
    # ----------------------------------------------

    if not data["hour"].between(
        0,
        23
    ).all():
        errors.append(
            "hour must contain values "
            "from 0 to 23"
        )

    # ----------------------------------------------
    # 7. new_device
    # ----------------------------------------------

    if not data["new_device"].isin(
        [0, 1]
    ).all():
        errors.append(
            "new_device must contain "
            "only 0 or 1"
        )

    # ----------------------------------------------
    # 8. foreign_country
    # ----------------------------------------------

    if not data["foreign_country"].isin(
        [0, 1]
    ).all():
        errors.append(
            "foreign_country must contain "
            "only 0 or 1"
        )

    # ----------------------------------------------
    # 9. transactions_last_hour
    # ----------------------------------------------

    if (
        data["transactions_last_hour"] < 0
    ).any():
        errors.append(
            "transactions_last_hour cannot "
            "contain negative values"
        )

    # ----------------------------------------------
    # 10. fraud
    # ----------------------------------------------

    if not data["fraud"].isin(
        [0, 1]
    ).all():
        errors.append(
            "fraud must contain "
            "only 0 or 1"
        )

    # ----------------------------------------------
    # 11. Проверяем наличие обоих классов
    # ----------------------------------------------

    fraud_classes = set(
        data["fraud"].unique()
    )

    if fraud_classes != {0, 1}:
        errors.append(
            "Dataset must contain both "
            "fraud classes: 0 and 1"
        )

    return errors