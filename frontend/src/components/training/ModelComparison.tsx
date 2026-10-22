"use client";

import { useEffect, useState } from "react";

import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import type {
  CandidatesResponse,
  CandidateModel,
  ConfusionMatrix as ConfusionMatrixType,
} from "@/types/training";

interface ModelComparisonProps {
  trainingId: string;
}

export default function ModelComparison({
  trainingId,
}: ModelComparisonProps) {
  const [data, setData] = useState<CandidatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await api.get<CandidatesResponse>(
          `/api/candidates/${trainingId}`
        );

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              err,
              "Не удалось получить результаты обучения."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCandidates();

    return () => {
      cancelled = true;
    };
  }, [trainingId]);

  if (loading) {
    return (
      <div className="mt-5">
        <LoadingSpinner text="Загрузка метрик моделей..." />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
      >
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (!data.baseline?.metrics || !data.balanced?.metrics) {
    return (
      <p role="alert" className="mt-4 text-red-600">
        Backend вернул некорректную структуру метрик.
      </p>
    );
  }

  const baseline = data.baseline;
  const balanced = data.balanced;

  const metrics = [
    {
      label: "Threshold",
      baseline: baseline.threshold,
      balanced: balanced.threshold,
      higherIsBetter: null,
    },
    {
      label: "Precision",
      baseline: baseline.metrics.precision,
      balanced: balanced.metrics.precision,
      higherIsBetter: true,
    },
    {
      label: "Recall",
      baseline: baseline.metrics.recall,
      balanced: balanced.metrics.recall,
      higherIsBetter: true,
    },
    {
      label: "F1-score",
      baseline: baseline.metrics.f1,
      balanced: balanced.metrics.f1,
      higherIsBetter: true,
    },
    {
      label: "PR-AUC",
      baseline: baseline.metrics.pr_auc,
      balanced: balanced.metrics.pr_auc,
      higherIsBetter: true,
    },
    {
      label: "Validation Loss",
      baseline: baseline.validation_loss,
      balanced: balanced.validation_loss,
      higherIsBetter: false,
    },
    {
      label: "Test Loss",
      baseline: baseline.test_loss,
      balanced: balanced.test_loss,
      higherIsBetter: false,
    },
  ];

  const getValueClass = (
    value: number,
    other: number,
    higherIsBetter: boolean | null
  ) => {
    if (higherIsBetter === null || value === other) {
      return "text-gray-900";
    }

    const isBetter = higherIsBetter
      ? value > other
      : value < other;

    return isBetter
      ? "font-bold text-green-700"
      : "text-gray-900";
  };

  const formatValue = (label: string, value: number) => {
    if (label.includes("Loss")) {
      return value.toLocaleString("ru-RU");
    }

    return value.toFixed(4);
  };

  return (
    <div className="mt-5 space-y-6">
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          Training ID
        </p>

        <p className="font-mono text-sm text-gray-900">
          {data.training_id}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DatasetStat label="Всего" value={data.dataset.rows} />
        <DatasetStat label="Train" value={data.dataset.train_rows} />
        <DatasetStat label="Validation" value={data.dataset.validation_rows} />
        <DatasetStat label="Test" value={data.dataset.test_rows} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3">Метрика</th>
              <th className="px-4 py-3">Baseline</th>
              <th className="px-4 py-3">Balanced</th>
            </tr>
          </thead>

          <tbody>
            {metrics.map((metric) => (
              <tr
                key={metric.label}
                className="border-b border-gray-100"
              >
                <td className="px-4 py-3 text-gray-700">
                  {metric.label}
                </td>

                <td
                  className={`px-4 py-3 ${getValueClass(
                    metric.baseline,
                    metric.balanced,
                    metric.higherIsBetter
                  )}`}
                >
                  {formatValue(metric.label, metric.baseline)}
                </td>

                <td
                  className={`px-4 py-3 ${getValueClass(
                    metric.balanced,
                    metric.baseline,
                    metric.higherIsBetter
                  )}`}
                >
                  {formatValue(metric.label, metric.balanced)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ConfusionMatrixCard
          title="Baseline"
          model={baseline}
        />

        <ConfusionMatrixCard
          title="Balanced"
          model={balanced}
        />
      </div>

      <p className="text-sm text-gray-500">
        Зелёным выделено лучшее значение.
        Для Validation Loss и Test Loss меньшее значение лучше.
        Threshold не оценивается как лучше или хуже.
      </p>
    </div>
  );
}

function DatasetStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function ConfusionMatrixCard({
  title,
  model,
}: {
  title: string;
  model: CandidateModel;
}) {
  const matrix: ConfusionMatrixType =
    model.metrics.confusion_matrix;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900">
        Confusion Matrix — {title}
      </h3>

      <p className="mt-2 text-xs text-gray-500">
        Строки — реальные классы, столбцы — предсказанные.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MatrixCell label="TN" value={matrix.tn} correct />
        <MatrixCell label="FP" value={matrix.fp} correct={false} />
        <MatrixCell label="FN" value={matrix.fn} correct={false} />
        <MatrixCell label="TP" value={matrix.tp} correct />
      </div>
    </div>
  );
}

function MatrixCell({
  label,
  value,
  correct,
}: {
  label: string;
  value: number;
  correct: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 text-center ${
        correct ? "bg-green-50" : "bg-red-50"
      }`}
    >
      <p className="text-sm text-gray-600">{label}</p>

      <p
        className={`text-2xl font-bold ${
          correct ? "text-green-700" : "text-red-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}