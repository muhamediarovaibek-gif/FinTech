import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-bold">
        Система обнаружения мошенничества
      </h1>

      <p className="mt-4 max-w-2xl text-gray-600">
        Анализируйте финансовые транзакции и управляйте
        моделями обнаружения мошенничества.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/analysis"
          className="rounded-lg bg-black px-5 py-3 text-white"
        >
          Анализировать транзакцию
        </Link>

        <Link
          href="/training"
          className="rounded-lg border border-gray-300 px-5 py-3"
        >
          Обучить модель
        </Link>
      </div>
    </main>
  );
}