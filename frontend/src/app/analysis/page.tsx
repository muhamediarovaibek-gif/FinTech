import TransactionForm from "@/components/transaction/TransactionForm";

export default function AnalysisPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold">
        Анализ транзакции
      </h1>

      <p className="mt-2 text-gray-600">
        Введите данные финансовой транзакции для проверки
        на признаки мошенничества.
      </p>

      <TransactionForm />
    </main>
  );
}