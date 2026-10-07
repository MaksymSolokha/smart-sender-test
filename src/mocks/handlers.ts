import { delay, http, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw';
import type { ApiErrorType, FieldErrors } from '../api/errors';
import type { Webhook, WebhookList } from '../api/schemas';
import { db, isSessionActive, MOCK_CREDENTIALS, MOCK_CSRF_TOKEN, mockUser, SESSION_TTL_MS } from './db';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const ERROR_MESSAGES: Record<ApiErrorType, string> = {
  BadRequestException: 'Bad request.',
  AuthenticationException: 'Unauthenticated.',
  NotFoundException: 'Not found.',
  TokenMismatchException: 'CSRF token mismatch.',
  ValidationException: 'The given data was invalid.',
};

const STATUS_BY_TYPE: Record<ApiErrorType, number> = {
  BadRequestException: 400,
  AuthenticationException: 401,
  NotFoundException: 404,
  TokenMismatchException: 419,
  ValidationException: 422,
};

function errorResponse(type: ApiErrorType, payload?: FieldErrors) {
  return HttpResponse.json(
    { error: { type, message: ERROR_MESSAGES[type], ...(payload && { payload }) } },
    { status: STATUS_BY_TYPE[type] },
  );
}

type Resolver<Params extends PathParams = PathParams> = HttpResponseResolver<Params, DefaultBodyType>;

function withXhr<P extends PathParams>(resolver: Resolver<P>): Resolver<P> {
  return async (info) => {
    await delay();
    if (info.request.headers.get('X-Requested-With') !== 'XMLHttpRequest') {
      return errorResponse('BadRequestException');
    }
    return resolver(info);
  };
}

function withCsrf<P extends PathParams>(resolver: Resolver<P>): Resolver<P> {
  return withXhr((info) => {
    if (info.request.headers.get('X-CSRF-TOKEN') !== MOCK_CSRF_TOKEN) {
      return errorResponse('TokenMismatchException');
    }
    return resolver(info);
  });
}

function withSession<P extends PathParams>(resolver: Resolver<P>): Resolver<P> {
  return (info) => (isSessionActive() ? resolver(info) : errorResponse('AuthenticationException'));
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null);
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function validateWebhook(name: string, url: string): FieldErrors | null {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = ['The name field is required.'];
  else if (name.length > 255) errors.name = ['The name may not be greater than 255 characters.'];
  if (!url.trim()) errors.url = ['The url field is required.'];
  else if (!isHttpUrl(url)) errors.url = ['The url must be a valid URL.'];
  return Object.keys(errors).length > 0 ? errors : null;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function findWebhook(id: string | readonly string[] | undefined): Webhook | undefined {
  return db.webhooks.find((webhook) => String(webhook.id) === id);
}

export const handlers = [
  http.get(
    '*/csrf',
    withXhr(() => new HttpResponse(null, { status: 204, headers: { 'X-CSRF-TOKEN': MOCK_CSRF_TOKEN } })),
  ),

  http.post(
    '*/auth/login',
    withCsrf(async ({ request }) => {
      if (!request.headers.get('X-Captcha-Token')) {
        return errorResponse('ValidationException', { captcha: ['The captcha token is required.'] });
      }
      const body = await readJson(request);
      const email = asString(body.email);
      const password = asString(body.password);
      const fingerprint = asString(body.fingerprint);

      const errors: FieldErrors = {};
      if (!email) errors.email = ['The email field is required.'];
      if (!password) errors.password = ['The password field is required.'];
      if (!fingerprint) errors.fingerprint = ['The fingerprint field is required.'];
      if (Object.keys(errors).length > 0) return errorResponse('ValidationException', errors);

      if (email.toLowerCase() !== MOCK_CREDENTIALS.email || password !== MOCK_CREDENTIALS.password) {
        return errorResponse('ValidationException', { password: ['These credentials do not match our records.'] });
      }

      const deviceSessionToken = crypto.randomUUID();
      db.deviceTokens.set(deviceSessionToken, fingerprint);
      return HttpResponse.json({ device_session_token: deviceSessionToken });
    }),
  ),

  http.post(
    '*/auth/token/issue',
    withCsrf(async ({ request }) => {
      const body = await readJson(request);
      const token = asString(body.device_session_token);
      const fingerprint = asString(body.fingerprint);

      if (!token || db.deviceTokens.get(token) !== fingerprint) {
        return errorResponse('ValidationException', {
          device_session_token: ['The device session token is invalid.'],
        });
      }
      db.deviceTokens.delete(token);
      db.session = { fingerprint, expiresAt: Date.now() + SESSION_TTL_MS };
      return new HttpResponse(null, { status: 200 });
    }),
  ),

  http.post(
    '*/auth/token/rotate',
    withCsrf(async ({ request }) => {
      const { fingerprint } = await readJson(request);
      if (!db.session || db.session.fingerprint !== fingerprint) {
        return errorResponse('BadRequestException');
      }
      db.session.expiresAt = Date.now() + SESSION_TTL_MS;
      return new HttpResponse(null, { status: 200 });
    }),
  ),

  http.post(
    '*/auth/token/revoke',
    withCsrf(() => {
      db.session = null;
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  http.get(
    '*/v1/me',
    withXhr(withSession(() => HttpResponse.json(mockUser))),
  ),

  http.get(
    '*/v1/webhooks',
    withXhr(
      withSession(({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = parsePositiveInt(params.get('page'), 1);
        const limit = Math.min(parsePositiveInt(params.get('limit'), DEFAULT_LIMIT), MAX_LIMIT);
        const search = (params.get('search') ?? '').trim().toLowerCase();

        const filtered = search
          ? db.webhooks.filter((webhook) => webhook.name.toLowerCase().includes(search))
          : db.webhooks;
        const start = (page - 1) * limit;

        const result: WebhookList = {
          data: filtered.slice(start, start + limit),
          paging: {
            pages: { current: page, last: Math.max(1, Math.ceil(filtered.length / limit)) },
            results: { total: filtered.length, limitation: limit },
          },
        };
        return HttpResponse.json(result);
      }),
    ),
  ),

  http.get(
    '*/v1/webhooks/:id',
    withXhr(
      withSession(({ params }) => {
        const webhook = findWebhook(params.id);
        return webhook ? HttpResponse.json(webhook) : errorResponse('NotFoundException');
      }),
    ),
  ),

  http.put(
    '*/v1/webhooks/:id',
    withCsrf(
      withSession(async ({ params, request }) => {
        const webhook = findWebhook(params.id);
        if (!webhook) return errorResponse('NotFoundException');

        const body = await readJson(request);
        const name = asString(body.name);
        const url = asString(body.url);
        const errors = validateWebhook(name, url);
        if (errors) return errorResponse('ValidationException', errors);

        Object.assign(webhook, { name: name.trim(), url: url.trim() });
        return HttpResponse.json(webhook);
      }),
    ),
  ),
];
