import { getFingerprint } from '../lib/fingerprint';
import { createAuthApi } from './auth';
import { HttpClient } from './httpClient';
import { createUserApi } from './user';
import { createWebhooksApi } from './webhooks';

export const httpClient = new HttpClient({ getFingerprint });

export const authApi = createAuthApi(httpClient, getFingerprint);
export const userApi = createUserApi(httpClient);
export const webhooksApi = createWebhooksApi(httpClient);

export { ApiError, isApiError } from './errors';
export type * from './types';
