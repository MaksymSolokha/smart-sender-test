import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isApiError } from '../api';
import { getErrorMessage } from './errors';

export const ROOT_SERVER_ERROR = 'root.server' as const;

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  if (!isApiError(error) || !error.isValidation) {
    setError(ROOT_SERVER_ERROR, { type: 'server', message: getErrorMessage(error) });
    return;
  }

  const unmatched: string[] = [];
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const message = messages.join(' ');
    const formField = fields.find((name) => name === field);
    if (formField) setError(formField, { type: 'server', message }, { shouldFocus: true });
    else unmatched.push(message);
  }

  const hasMatched = Object.keys(error.fieldErrors).length > unmatched.length;
  if (unmatched.length > 0 || !hasMatched) {
    setError(ROOT_SERVER_ERROR, { type: 'server', message: unmatched.join(' ') || error.message });
  }
}
