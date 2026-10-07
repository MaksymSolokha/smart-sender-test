import { z } from 'zod';

export const webhookFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  url: z
    .string()
    .trim()
    .min(1, 'URL is required')
    .pipe(z.url({ protocol: /^https?$/, error: 'Enter a valid HTTP or HTTPS URL' })),
});

export type WebhookFormValues = z.infer<typeof webhookFormSchema>;
