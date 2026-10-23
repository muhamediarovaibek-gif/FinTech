"use client";

import AnalysisResultCard from "@/components/transaction/AnalysisResultCard";
import { useState, type FormEvent } from "react";
import axios from "axios";

import api from "@/lib/axios";

import type { Transaction } from "@/types/transaction";
import type { AnalysisResult } from "@/types/analysis";

export default function TransactionForm() {
  const [transaction, setTransaction] = useState<Transaction>({
    amount: 50,
    hour: 14,
    new_device: 0,
    foreign_country: 0,
    transactions_last_hour: 1,
  });

  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleNumberChange = (
    field: "amount" | "hour" | "transactions_last_hour",
    value: string
  ) => {
    setTransaction((prev) => ({
      ...prev,
      [field]: Number(value),
    }));
  };

  const handleBinaryChange = (
    field: "new_device" | "foreign_country",
    value: string
  ) => {
    setTransaction((prev) => ({
      ...prev,
      [field]: Number(value) as 0 | 1,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post<AnalysisResult>(
        "/api/analyze",
        transaction
      );

      setResult(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Не удалось выполнить анализ транзакции."
        );
      } else {
        setError("Произошла неизвестная ошибка.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="amount" className="mb-2 block font-medium">
            Сумма транзакции
          </label>

          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={transaction.amount}
            onChange={(e) =>
              handleNumberChange("amount", e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="hour" className="mb-2 block font-medium">
            Час транзакции (0–23)
          </label>

          <input
            id="hour"
            type="number"
            min="0"
            max="23"
            step="1"
            required
            value={transaction.hour}
            onChange={(e) =>
              handleNumberChange("hour", e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="new_device" className="mb-2 block font-medium">
            Новое устройство
          </label>

          <select
            id="new_device"
            value={transaction.new_device}
            onChange={(e) =>
              handleBinaryChange("new_device", e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="0">Нет</option>
            <option value="1">Да</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="foreign_country"
            className="mb-2 block font-medium"
          >
            Другая страна
          </label>

          <select
            id="foreign_country"
            value={transaction.foreign_country}
            onChange={(e) =>
              handleBinaryChange("foreign_country", e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="0">Нет</option>
            <option value="1">Да</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="transactions_last_hour"
            className="mb-2 block font-medium"
          >
            Количество транзакций за последний час
          </label>

          <input
            id="transactions_last_hour"
            type="number"
            min="0"
            step="1"
            required
            value={transaction.transactions_last_hour}
            onChange={(e) =>
              handleNumberChange(
                "transactions_last_hour",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Выполняется анализ..."
            : "Анализировать транзакцию"}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {result && <AnalysisResultCard result={result} />}
    </div>
  );
}