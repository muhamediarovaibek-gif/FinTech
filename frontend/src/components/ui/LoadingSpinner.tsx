interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({
  text = "Загрузка...",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3"
    >
      <div
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black"
      />

      <span className="text-sm text-gray-600">
        {text}
      </span>
    </div>
  );
}