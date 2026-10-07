export type ApiErrorType =
  | 'BadRequestException'
  | 'AuthenticationException'
  | 'NotFoundException'
  | 'TokenMismatchException'
  | 'ValidationException';

export type FieldErrors = Record<string, string[]>;

export interface ApiErrorBody {
  error: {
    type: ApiErrorType;
    message: string;
    payload?: FieldErrors;
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly type: ApiErrorType | 'UnknownError',
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isValidation(): boolean {
    return this.status === 422;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value;
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof error.type === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  if (isApiErrorBody(body)) {
    return new ApiError(response.status, body.error.type, body.error.message, body.error.payload);
  }
  return new ApiError(response.status, 'UnknownError', `Request failed with status ${response.status}`);
}
