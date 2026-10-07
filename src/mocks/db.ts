import type { User, Webhook } from '../api/schemas';

export const MOCK_CREDENTIALS = { email: 'admin@example.com', password: 'password123' } as const;
export const MOCK_CSRF_TOKEN = 'b2c7f1e0a9d84f3c8e6a5d4b3c2a1f0e';
export const SESSION_TTL_MS = 30_000;

export const mockUser: User = {
  id: 1,
  email: MOCK_CREDENTIALS.email,
  first_name: 'Olena',
  last_name: 'Kovalenko',
  name: 'Olena Kovalenko',
};

const WEBHOOK_NAMES = [
  'Order created', 'Order paid', 'Order shipped', 'Order cancelled', 'Refund issued',
  'Customer registered', 'Customer updated', 'Customer deleted', 'Subscription started',
  'Subscription renewed', 'Subscription cancelled', 'Invoice generated', 'Invoice overdue',
  'Payment failed', 'Cart abandoned', 'Product created', 'Product out of stock',
  'Review submitted', 'Support ticket opened', 'Support ticket closed', 'Newsletter signup',
  'Lead captured', 'Chat started', 'Chat finished', 'Campaign sent', 'Campaign bounced',
  'Daily report',
];

function createWebhooks(): Webhook[] {
  const base = Date.UTC(2026, 0, 1);
  return WEBHOOK_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    url: `https://hooks.example.com/${name.toLowerCase().replace(/\s+/g, '-')}`,
    active: index % 3 !== 0,
    created_at: new Date(base + index * 86_400_000).toISOString(),
  }));
}

interface Session {
  fingerprint: string;
  expiresAt: number;
}

export const db = {
  webhooks: createWebhooks(),
  deviceTokens: new Map<string, string>(),
  session: null as Session | null,
};

export function resetDb(): void {
  db.webhooks = createWebhooks();
  db.deviceTokens.clear();
  db.session = null;
}

export function isSessionActive(now = Date.now()): boolean {
  return db.session !== null && now < db.session.expiresAt;
}

export function expireSession(): void {
  if (db.session) db.session.expiresAt = 0;
}
