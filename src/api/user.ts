import type { HttpClient } from './httpClient';
import type { User } from './types';

export function createUserApi(http: HttpClient) {
  return {
    me(signal?: AbortSignal): Promise<User> {
      return http.get<User>('/v1/me', { signal });
    },
  };
}
