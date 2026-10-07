import type { HttpClient } from './httpClient';
import { webhookListSchema, webhookSchema, type Webhook, type WebhookList } from './schemas';
import type { WebhookListParams, WebhookUpdate } from './types';

export function createWebhooksApi(http: HttpClient) {
  return {
    list({ page, limit, search }: WebhookListParams, signal?: AbortSignal): Promise<WebhookList> {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) query.set('search', search);
      return http.get(`/v1/webhooks?${query}`, { schema: webhookListSchema, signal });
    },

    get(id: number, signal?: AbortSignal): Promise<Webhook> {
      return http.get(`/v1/webhooks/${id}`, { schema: webhookSchema, signal });
    },

    update(id: number, data: WebhookUpdate): Promise<Webhook> {
      return http.put(`/v1/webhooks/${id}`, data, { schema: webhookSchema });
    },
  };
}
