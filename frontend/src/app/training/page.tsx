import TrainingDashboard from "@/components/training/TrainingDashboard";

export default function TrainingPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900">
        Обучение моделей
      </h1>

      <p className="mt-2 text-gray-600">
        Загрузите датасет, обучите модели обнаружения
        мошенничества и выберите активную модель.
      </p>

      <TrainingDashboard />
    </main>
  );
}