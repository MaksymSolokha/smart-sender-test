import { z } from 'zod';

const apiErrorTypeSchema = z.enum([
  'BadRequestException',
  'AuthenticationException',
  'NotFoundException',
  'TokenMismatchException',
  'ValidationException',
]);

const fieldErrorsSchema = z.record(z.string(), z.array(z.string()));

const apiErrorBodySchema = z.object({
  error: z.object({
    type: apiErrorTypeSchema,
    message: z.string(),
    payload: fieldErrorsSchema.optional(),
  }),
});

export type ApiErrorType = z.infer<typeof apiErrorTypeSchema>;
export type FieldErrors = z.infer<typeof fieldErrorsSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly type: ApiErrorType | 'InvalidResponse' | 'UnknownError',
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

export async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = apiErrorBodySchema.safeParse(body);
  if (parsed.success) {
    const { type, message, payload } = parsed.data.error;
    return new ApiError(response.status, type, message, payload);
  }
  return new ApiError(response.status, 'UnknownError', `Request failed with status ${response.status}`);
}
