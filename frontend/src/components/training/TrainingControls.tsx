"use client";

import { useState } from "react";
import axios from "axios";

import api from "@/lib/axios";

import type {
  TrainingRequest,
  TrainingResponse,
} from "@/types/training";

import { getApiErrorMessage } from "@/lib/apiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface TrainingControlsProps {
  datasetId: string | null;
  onTrainingStart: () => void;
  onTrainingSuccess: (trainingId: string) => void;
}

export default function TrainingControls({
  datasetId,
  onTrainingStart,
  onTrainingSuccess,
}: TrainingControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTrain = async () => {
    if (!datasetId) {
      setError("Сначала необходимо загрузить датасет.");
      return;
    }

    if (loading) {
      return;
    }

    onTrainingStart();

    setLoading(true);
    setError(null);
    setSuccess(false);

    const requestData: TrainingRequest = {
      dataset_id: datasetId,
    };

    try {
      const response = await api.post<TrainingResponse>(
        "/api/train",
        requestData
      );

      onTrainingSuccess(response.data.training_id);
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Не удалось обучить модели."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 space-y-4">
      <p className="text-gray-600">
        После запуска будут обучены две модели:
        Baseline и Balanced.
      </p>

      {datasetId ? (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            Выбранный датасет
          </p>

          <p className="mt-1 font-mono text-sm text-gray-900">
            {datasetId}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Для обучения сначала загрузите датасет.
        </p>
      )}

      <button
        type="button"
        onClick={handleTrain}
        disabled={!datasetId || loading}
        className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Обучение моделей..." : "Обучить модели"}
      </button>

      {loading && (
        <LoadingSpinner text="Выполняется обучение моделей..." />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700"
        >
          Обучение моделей успешно завершено.
        </div>
      )}
    </div>
  );
}