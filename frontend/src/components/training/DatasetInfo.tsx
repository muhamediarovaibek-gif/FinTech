import type { DatasetUploadResponse } from "@/types/training";

interface DatasetInfoProps {
  dataset: DatasetUploadResponse;
}

export default function DatasetInfo({
  dataset,
}: DatasetInfoProps) {
  const normalPercentage =
    dataset.rows > 0
      ? (dataset.normal_count / dataset.rows) * 100
      : 0;

  const fraudPercentage = dataset.fraud_rate * 100;

  const formatNumber = (value: number) =>
    value.toLocaleString("ru-RU");

  return (
    <div className="mt-5 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Всего транзакций
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(dataset.rows)}
          </p>
        </div>

        <div className="rounded-lg bg-green-50 p-5">
          <p className="text-sm text-green-700">
            Нормальные транзакции
          </p>

          <p className="mt-2 text-3xl font-bold text-green-700">
            {formatNumber(dataset.normal_count)}
          </p>
        </div>

        <div className="rounded-lg bg-red-50 p-5">
          <p className="text-sm text-red-700">
            Мошеннические транзакции
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">
            {formatNumber(dataset.fraud_count)}
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900">
          Распределение классов
        </h3>

        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-gray-200">
          <div
            className="bg-green-500"
            style={{ width: `${normalPercentage}%` }}
          />

          <div
            className="bg-red-500"
            style={{ width: `${fraudPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-3 text-sm">
          <span className="text-green-700">
            Нормальные: {normalPercentage.toFixed(2)}%
          </span>

          <span className="text-red-700">
            Мошеннические: {fraudPercentage.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          Название файла
        </p>

        <p className="mt-1 font-medium text-gray-900">
          {dataset.filename}
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Идентификатор датасета
        </p>

        <p className="mt-1 font-mono text-sm text-gray-900">
          {dataset.dataset_id}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900">
          Столбцы датасета
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {dataset.columns.map((column) => (
            <span
              key={column}
              className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-700"
            >
              {column}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}