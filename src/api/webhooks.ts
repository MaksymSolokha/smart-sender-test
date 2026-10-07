import type { HttpClient } from './httpClient';
import type { Webhook, WebhookList, WebhookListParams, WebhookUpdate } from './types';

export function createWebhooksApi(http: HttpClient) {
  return {
    list({ page, limit, search }: WebhookListParams, signal?: AbortSignal): Promise<WebhookList> {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) query.set('search', search);
      return http.get<WebhookList>(`/v1/webhooks?${query}`, { signal });
    },

    get(id: number, signal?: AbortSignal): Promise<Webhook> {
      return http.get<Webhook>(`/v1/webhooks/${id}`, { signal });
    },

    update(id: number, data: WebhookUpdate): Promise<Webhook> {
      return http.put<Webhook>(`/v1/webhooks/${id}`, data);
    },
  };
}
