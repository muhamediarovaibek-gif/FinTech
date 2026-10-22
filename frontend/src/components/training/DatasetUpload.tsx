"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";

import api from "@/lib/axios";
import type { DatasetUploadResponse } from "@/types/training";
import { getApiErrorMessage } from "@/lib/apiError";

interface DatasetUploadProps {
  onUploadSuccess: (data: DatasetUploadResponse) => void;
}

export default function DatasetUpload({
  onUploadSuccess,
}: DatasetUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!file) {
      setError("Сначала выберите файл.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "csv" && extension !== "xlsx") {
      setError("Поддерживаются только файлы CSV и XLSX.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post<DatasetUploadResponse>(
        "/api/datasets",
        formData
      );

      onUploadSuccess(response.data);
      setSuccess(true);
    } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "Не удалось загрузить датасет."
          )
        );
      } finally {
    setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <label
          htmlFor="dataset-file"
          className="block cursor-pointer font-medium text-gray-900"
        >
          Выберите CSV или XLSX файл
        </label>

        <input
          id="dataset-file"
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          disabled={loading}
          className="mt-4 block w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-700"
        />

        <p className="mt-3 text-sm text-gray-500">
          Файл должен содержать признаки транзакций и столбец fraud.
        </p>
      </div>

      {file && (
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Файл:</span>{" "}
            {file.name}
          </p>

          <p className="mt-1">
            <span className="font-semibold">Размер:</span>{" "}
            {(file.size / 1024).toFixed(2)} КБ
          </p>
        </div>
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
          Датасет успешно загружен.
        </div>
      )}

      <button
        type="submit"
        disabled={!file || loading}
        className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Загрузка..." : "Загрузить датасет"}
      </button>
    </form>
  );
}