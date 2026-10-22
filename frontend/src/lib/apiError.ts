import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Произошла ошибка при выполнении запроса."
): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return "Не удалось подключиться к серверу. Проверьте, запущен ли Backend.";
  }

  const detail = error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (typeof item?.msg === "string") {
          return item.msg;
        }

        return "Ошибка валидации";
      })
      .join("; ");
  }

  if (detail && typeof detail === "object") {
    if (Array.isArray(detail.errors)) {
      return detail.errors.map(String).join("; ");
    }

    if (typeof detail.message === "string") {
      return detail.message;
    }
  }

  if (error.response.status >= 500) {
    return "Внутренняя ошибка сервера. Попробуйте позже.";
  }

  return fallback;
}