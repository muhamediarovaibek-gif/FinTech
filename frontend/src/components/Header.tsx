import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold"
        >
          Fraud Detection
        </Link>

        <div className="flex gap-6">
          <Link
            href="/analysis"
            className="text-gray-600 hover:text-black"
          >
            Анализ транзакции
          </Link>

          <Link
            href="/training"
            className="text-gray-600 hover:text-black"
          >
            Обучение модели
          </Link>
        </div>
      </nav>
    </header>
  );
}