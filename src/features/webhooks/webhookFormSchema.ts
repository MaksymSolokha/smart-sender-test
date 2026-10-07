import { z } from 'zod';

export const webhookFormSchema = z.object({
  name: z.string().trim().min(1, 'Вкажіть назву').max(255, 'Назва не може бути довшою за 255 символів'),
  url: z
    .string()
    .trim()
    .min(1, 'Вкажіть URL')
    .pipe(z.url({ protocol: /^https?$/, error: 'Вкажіть коректну HTTP/HTTPS-адресу' })),
});

export type WebhookFormValues = z.infer<typeof webhookFormSchema>;
