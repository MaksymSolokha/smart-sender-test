export interface WebhookListParams {
  page: number;
  limit: number;
  search: string;
}

export interface WebhookUpdate {
  name: string;
  url: string;
}

export interface Credentials {
  email: string;
  password: string;
}
