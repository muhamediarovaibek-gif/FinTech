import type { AnalysisResult } from "@/types/analysis";
import Explanation from "@/components/transaction/Explanation";

interface AnalysisResultCardProps {
  result: AnalysisResult;
}

export default function AnalysisResultCard({
  result,
}: AnalysisResultCardProps) {
  const probabilityPercent = (result.probability * 100).toFixed(2);

  const riskLabels = {
    LOW: "Низкий",
    MEDIUM: "Средний",
    HIGH: "Высокий",
  };

  const decisionLabels = {
    ALLOW: "Разрешить",
    REVIEW: "Отправить на проверку",
    BLOCK: "Заблокировать",
  };

  const predictionLabels = {
    FRAUD: "Мошенническая",
    NORMAL: "Нормальная",
  };

  const riskColors = {
    LOW: "text-green-600",
    MEDIUM: "text-yellow-600",
    HIGH: "text-red-600",
  };

  const progressColors = {
    LOW: "bg-green-500",
    MEDIUM: "bg-yellow-500",
    HIGH: "bg-red-500",
  };

  return (
    <div>
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
            Результат анализа
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
                Вероятность мошенничества
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
                {probabilityPercent}%
            </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
                Risk Score
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
                {result.risk_score}
                <span className="text-base font-normal text-gray-500">
                {" "}/ 1000
                </span>
            </p>
            </div>
        </div>

        <div className="mt-6">
            <div className="flex justify-between">
            <span className="text-gray-600">
                Уровень риска
            </span>

            <span className={`font-semibold ${riskColors[result.risk_level]}`}>
                {riskLabels[result.risk_level]}
            </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
            <div
                className={`h-full rounded-full ${progressColors[result.risk_level]}`}
                style={{
                width: `${Math.max(0, Math.min(100, result.risk_score / 10))}%`,
                }}
            />
            </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">
                Классификация модели
            </span>

            <span className="font-semibold text-gray-900">
                {predictionLabels[result.prediction]}
            </span>
            </div>

            <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">
                Решение системы
            </span>

            <span className={`font-semibold ${riskColors[result.risk_level]}`}>
                {decisionLabels[result.decision]}
            </span>
            </div>
        </div>
      </section>

      <Explanation explanation={result.explanation} />
    </div>
  );
}