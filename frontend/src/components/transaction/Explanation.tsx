import type { ExplanationItem } from "@/types/analysis";

interface ExplanationProps {
  explanation: ExplanationItem[];
}

const featureLabels: Record<string, string> = {
  amount: "Сумма транзакции",
  hour: "Час транзакции",
  new_device: "Новое устройство",
  foreign_country: "Другая страна",
  transactions_last_hour: "Транзакций за последний час",
};

export default function Explanation({
  explanation,
}: ExplanationProps) {
  if (!explanation || explanation.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-xl font-bold text-gray-900">
          Объяснение решения модели
        </h3>

        <p className="mt-3 text-gray-500">
          Данные объяснения недоступны.
        </p>
      </div>
    );
  }

  const sortedExplanation = [...explanation].sort(
    (a, b) => Math.abs(b.impact) - Math.abs(a.impact)
  );

  const maxImpact = Math.max(
    ...sortedExplanation.map((item) => Math.abs(item.impact)),
    0.000001
  );

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900">
        Объяснение решения модели (SHAP)
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        Ниже показано, какие признаки увеличивают или
        уменьшают оценку вероятности мошенничества.
      </p>

      <div className="mt-6 space-y-5">
        {sortedExplanation.map((item) => {
          const isFraudDirection = item.impact > 0;
          const isNormalDirection = item.impact < 0;

          const percentage =
            (Math.abs(item.impact) / maxImpact) * 100;

          const featureName =
            featureLabels[item.feature] ?? item.feature;

          return (
            <div key={item.feature}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-medium text-gray-900">
                  {featureName}
                </span>

                <span
                  className={
                    isFraudDirection
                      ? "font-semibold text-red-600"
                      : isNormalDirection
                        ? "font-semibold text-green-600"
                        : "font-semibold text-gray-500"
                  }
                >
                  {item.impact > 0 ? "+" : ""}
                  {item.impact.toFixed(4)}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${
                    isFraudDirection
                      ? "bg-red-500"
                      : isNormalDirection
                        ? "bg-green-500"
                        : "bg-gray-400"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {isFraudDirection
                  ? "Увеличивает оценку мошенничества"
                  : isNormalDirection
                    ? "Уменьшает оценку мошенничества"
                    : "Нейтральное влияние"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        <p>
          <span className="font-semibold text-red-600">
            Красный
          </span>
          {" "}— влияние в сторону мошенничества.
        </p>

        <p className="mt-2">
          <span className="font-semibold text-green-600">
            Зелёный
          </span>
          {" "}— влияние в сторону нормальной транзакции.
        </p>

        <p className="mt-3">
          Длина полосы показывает относительную величину
          SHAP-вклада среди признаков этой транзакции.
          Это не процент мошенничества.
        </p>
      </div>
    </section>
  );
}