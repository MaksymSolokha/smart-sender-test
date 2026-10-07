import type { HttpClient } from './httpClient';
import { userSchema, type User } from './schemas';

export function createUserApi(http: HttpClient) {
  return {
    me(signal?: AbortSignal): Promise<User> {
      return http.get('/v1/me', { schema: userSchema, signal });
    },
  };
}
