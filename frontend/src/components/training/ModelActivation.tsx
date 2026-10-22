"use client";

import { useState } from "react";
import axios from "axios";

import api from "@/lib/axios";

import type {
  ModelType,
  ActivateModelRequest,
} from "@/types/training";

import { getApiErrorMessage } from "@/lib/apiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ModelActivationProps {
  trainingId: string;
}

export default function ModelActivation({
  trainingId,
}: ModelActivationProps) {
  const [selectedModel, setSelectedModel] =
    useState<ModelType>("balanced");

  const [activeModel, setActiveModel] =
    useState<ModelType | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setActiveModel(null);

    const requestData: ActivateModelRequest = {
      training_id: trainingId,
      model_type: selectedModel,
    };

    try {
      await api.post("/api/activate", requestData);

      setActiveModel(selectedModel);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Не удалось активировать модель."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 space-y-5">
      <p className="text-gray-600">
        Выберите обученную модель, которая будет
        использоваться для анализа транзакций.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label
          className={`cursor-pointer rounded-xl border-2 p-5 ${
            selectedModel === "baseline"
              ? "border-black bg-gray-50"
              : "border-gray-200"
          }`}
        >
          <input
            type="radio"
            name="model"
            value="baseline"
            checked={selectedModel === "baseline"}
            onChange={() => {
              setSelectedModel("baseline");
              setError(null);
            }}
            disabled={loading}
            className="mr-2"
          />

          <span className="font-semibold text-gray-900">
            Baseline
          </span>

          <p className="mt-2 text-sm text-gray-600">
            Обычная логистическая регрессия.
          </p>
        </label>

        <label
          className={`cursor-pointer rounded-xl border-2 p-5 ${
            selectedModel === "balanced"
              ? "border-black bg-gray-50"
              : "border-gray-200"
          }`}
        >
          <input
            type="radio"
            name="model"
            value="balanced"
            checked={selectedModel === "balanced"}
            onChange={() => {
              setSelectedModel("balanced");
              setError(null);
            }}
            disabled={loading}
            className="mr-2"
          />

          <span className="font-semibold text-gray-900">
            Balanced
          </span>

          <p className="mt-2 text-sm text-gray-600">
            Логистическая регрессия с учётом
            дисбаланса классов.
          </p>
        </label>
      </div>

      <button
      type="button"
      onClick={handleActivate}
      disabled={loading}
      className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
      {loading ? "Активация модели..." : "Активировать модель"}
      </button>

      {loading && (
      <LoadingSpinner text="Выполняется активация модели..." />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {activeModel && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700"
        >
          <p className="font-semibold">
            Модель успешно активирована
          </p>

          <p className="mt-1">
            Сервер подтвердил активацию модели: {activeModel}
          </p>
        </div>
      )}
    </div>
  );
}