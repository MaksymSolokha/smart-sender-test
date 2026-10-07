import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  name: z.string(),
});

export const webhookSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  active: z.boolean(),
  created_at: z.iso.datetime(),
});

export const pagingSchema = z.object({
  pages: z.object({ current: z.number().int(), last: z.number().int() }),
  results: z.object({ total: z.number().int(), limitation: z.number().int() }),
});

export const webhookListSchema = z.object({
  data: z.array(webhookSchema),
  paging: pagingSchema,
});

export const loginResponseSchema = z.object({
  device_session_token: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type Paging = z.infer<typeof pagingSchema>;
export type WebhookList = z.infer<typeof webhookListSchema>;
