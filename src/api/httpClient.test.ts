import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { expireSession, MOCK_CREDENTIALS, resetDb } from '../mocks/db';
import { server } from '../mocks/node';
import { createAuthApi } from './auth';
import { ApiError } from './errors';
import { HttpClient } from './httpClient';
import { userSchema, webhookListSchema, webhookSchema } from './schemas';

const FINGERPRINT = '0123456789abcdef0123456789abcdef';
const getFingerprint = () => FINGERPRINT;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

function countRequests(method: string, pathname: string) {
  const counter = { value: 0 };
  server.events.on('request:start', ({ request }) => {
    if (request.method === method && new URL(request.url).pathname === pathname) counter.value += 1;
  });
  return counter;
}

async function createSignedInClient() {
  const client = new HttpClient({ baseUrl: 'http://localhost', getFingerprint });
  await createAuthApi(client, getFingerprint).signIn(MOCK_CREDENTIALS);
  return client;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetDb());
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => server.close());

describe('HttpClient session refresh', () => {
  it('two parallel requests with 401 share one rotate and both retries succeed', async () => {
    const client = await createSignedInClient();
    const onExpired = vi.fn();
    client.onSessionExpired(onExpired);

    expireSession();

    const bothUnauthorized = deferred();
    let unauthorizedCount = 0;
    server.events.on('response:mocked', ({ response }) => {
      if (response.status === 401 && ++unauthorizedCount === 2) bothUnauthorized.resolve();
    });
    server.use(http.post('*/auth/token/rotate', () => bothUnauthorized.promise));
    const rotateCalls = countRequests('POST', '/auth/token/rotate');

    const [me, webhooks] = await Promise.all([
      client.get('/v1/me', { schema: userSchema }),
      client.get('/v1/webhooks?page=1&limit=10', { schema: webhookListSchema }),
    ]);

    expect(unauthorizedCount).toBe(2);
    expect(rotateCalls.value).toBe(1);
    expect(me.email).toBe(MOCK_CREDENTIALS.email);
    expect(webhooks.data).toHaveLength(10);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('expires the local session when rotate fails', async () => {
    const client = await createSignedInClient();
    const onExpired = vi.fn();
    client.onSessionExpired(onExpired);

    await client.post('/auth/token/revoke', { fingerprint: FINGERPRINT }, { skipSessionRefresh: true });

    await expect(client.get('/v1/me')).rejects.toMatchObject({ status: 400 } satisfies Partial<ApiError>);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('re-fetches the CSRF token on 419 and retries once', async () => {
    const client = await createSignedInClient();
    const csrfCalls = countRequests('GET', '/csrf');
    server.use(
      http.put('*/v1/webhooks/:id', () =>
        HttpResponse.json(
          { error: { type: 'TokenMismatchException', message: 'CSRF token mismatch.' } },
          { status: 419 },
        ),
        { once: true },
      ),
    );

    const updated = await client.put(
      '/v1/webhooks/1',
      { name: 'Renamed', url: 'https://example.com/hook' },
      { schema: webhookSchema },
    );

    expect(updated.name).toBe('Renamed');
    expect(csrfCalls.value).toBe(1);
  });

  it('rejects a response that does not match the schema', async () => {
    const client = await createSignedInClient();
    server.use(http.get('*/v1/me', () => HttpResponse.json({ id: 'not-a-number' }), { once: true }));

    await expect(client.get('/v1/me', { schema: userSchema })).rejects.toMatchObject({
      type: 'InvalidResponse',
    } satisfies Partial<ApiError>);
  });
});
