import { isApiError } from '../api';

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.type === 'InvalidResponse') return 'The server returned data in an unexpected format.';
    if (error.status === 404) return 'Not found.';
    if (error.status >= 500) return 'Server error. Please try again later.';
    return error.message;
  }
  if (error instanceof TypeError) return 'Unable to reach the server.';
  return 'Something went wrong.';
}
