import type { HttpClient } from './httpClient';
import type { Credentials } from './types';

const CAPTCHA_STUB_TOKEN = 'captcha-stub-token';

const authOnly = { skipSessionRefresh: true } as const;

export function createAuthApi(http: HttpClient, getFingerprint: () => string) {
  async function login({ email, password }: Credentials): Promise<string> {
    const { device_session_token } = await http.post<{ device_session_token: string }>(
      '/auth/login',
      { email, password, fingerprint: getFingerprint() },
      { ...authOnly, headers: { 'X-Captcha-Token': CAPTCHA_STUB_TOKEN } },
    );
    return device_session_token;
  }

  function issueSession(deviceSessionToken: string): Promise<void> {
    return http.post<void>(
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
      return http.post<void>('/auth/token/revoke', { fingerprint: getFingerprint() }, authOnly);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
