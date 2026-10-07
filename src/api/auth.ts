import type { HttpClient } from './httpClient';
import { loginResponseSchema } from './schemas';
import type { Credentials } from './types';

const CAPTCHA_STUB_TOKEN = 'captcha-stub-token';

const authOnly = { skipSessionRefresh: true } as const;

export function createAuthApi(http: HttpClient, getFingerprint: () => string) {
  async function login({ email, password }: Credentials): Promise<string> {
    const { device_session_token } = await http.post(
      '/auth/login',
      { email, password, fingerprint: getFingerprint() },
      { ...authOnly, schema: loginResponseSchema, headers: { 'X-Captcha-Token': CAPTCHA_STUB_TOKEN } },
    );
    return device_session_token;
  }

  function issueSession(deviceSessionToken: string): Promise<void> {
    return http.post(
      '/auth/token/issue',
      { device_session_token: deviceSessionToken, fingerprint: getFingerprint() },
      authOnly,
    );
  }

  return {
    async signIn(credentials: Credentials): Promise<void> {
      const deviceSessionToken = await login(credentials);
      await issueSession(deviceSessionToken);
    },

    revoke(): Promise<void> {
      return http.post('/auth/token/revoke', { fingerprint: getFingerprint() }, authOnly);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
