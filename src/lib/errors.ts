import { isApiError } from '../api';

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 404) return 'Не знайдено.';
    if (error.status >= 500) return 'Помилка сервера. Спробуйте пізніше.';
    return error.message;
  }
  if (error instanceof TypeError) return 'Немає з’єднання з сервером.';
  return 'Щось пішло не так.';
}
