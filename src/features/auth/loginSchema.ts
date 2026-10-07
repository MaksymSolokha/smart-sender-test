import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Вкажіть email').pipe(z.email('Некоректний email')),
  password: z.string().min(1, 'Вкажіть пароль'),
});

export type LoginValues = z.infer<typeof loginSchema>;
