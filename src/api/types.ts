export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
}

export interface Webhook {
  id: number;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
}

export interface Paging {
  pages: { current: number; last: number };
  results: { total: number; limitation: number };
}

export interface WebhookList {
  data: Webhook[];
  paging: Paging;
}

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
