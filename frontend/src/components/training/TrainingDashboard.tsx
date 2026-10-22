"use client";

import { useState } from "react";

import DatasetUpload from "@/components/training/DatasetUpload";
import DatasetInfo from "@/components/training/DatasetInfo";
import TrainingControls from "@/components/training/TrainingControls";
import ModelComparison from "@/components/training/ModelComparison";
import ModelActivation from "@/components/training/ModelActivation";

import type { DatasetUploadResponse } from "@/types/training";

export default function TrainingDashboard() {
  const [dataset, setDataset] =
    useState<DatasetUploadResponse | null>(null);

  const [trainingId, setTrainingId] =
    useState<string | null>(null);

  const handleUploadSuccess = (data: DatasetUploadResponse) => {
    setDataset(data);
    setTrainingId(null);
  };
  
  const handleTrainingStart = () => {
    setTrainingId(null);
  };

  const handleTrainingSuccess = (newTrainingId: string) => {
    setTrainingId(newTrainingId);
    };

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          1. Загрузка датасета
        </h2>

        <p className="mt-2 text-gray-600">
          Загрузите CSV или XLSX файл с историей финансовых транзакций.
        </p>

        <DatasetUpload onUploadSuccess={handleUploadSuccess} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          2. Информация о датасете
        </h2>

        {dataset ? (
          <DatasetInfo dataset={dataset} />
        ) : (
          <p className="mt-3 text-gray-500">
            Сначала необходимо загрузить датасет.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          3. Обучение моделей
        </h2>

        <TrainingControls
          key={dataset?.dataset_id ?? "no-dataset"}
          datasetId={dataset?.dataset_id ?? null}
          onTrainingStart={handleTrainingStart}
          onTrainingSuccess={handleTrainingSuccess}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          4. Сравнение моделей
        </h2>

        {trainingId ? (
          <ModelComparison
            key={trainingId}
            trainingId={trainingId}
          />
        ) : (
          <p className="mt-3 text-gray-500">
            Метрики появятся после обучения моделей.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          5. Активация модели
        </h2>

        {trainingId ? (
          <ModelActivation
            key={trainingId}
            trainingId={trainingId}
          />
        ) : (
          <p className="mt-3 text-gray-500">
            Сначала загрузите датасет и обучите модели.
          </p>
        )}
      </section>
    </div>
  );
}