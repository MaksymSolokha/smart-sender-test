import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { WebhookUpdate } from '../../api';
import { applyServerErrors } from '../../lib/forms';
import { webhookFormSchema } from './webhookFormSchema';

const FIELDS = ['name', 'url'] as const;

interface WebhookFormProps {
  defaultValues: WebhookUpdate;
  onSubmit: (values: WebhookUpdate) => Promise<unknown>;
  onCancel: () => void;
}

export function WebhookForm({ defaultValues, onSubmit, onCancel }: WebhookFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WebhookUpdate>({ resolver: zodResolver(webhookFormSchema), defaultValues });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      applyServerErrors(error, setError, FIELDS);
    }
  });

  return (
    <form className="card form" onSubmit={submit} noValidate>
      <label className="field">
        <span>Назва</span>
        <input aria-invalid={!!errors.name} {...register('name')} />
        {errors.name && <small className="field-error">{errors.name.message}</small>}
      </label>

      <label className="field">
        <span>URL</span>
        <input type="url" inputMode="url" aria-invalid={!!errors.url} {...register('url')} />
        {errors.url && <small className="field-error">{errors.url.message}</small>}
      </label>

      {errors.root?.server && <p className="form-error" role="alert">{errors.root.server.message}</p>}

      <div className="form-actions">
        <button type="button" className="button" onClick={onCancel}>
          Скасувати
        </button>
        <button type="submit" className="button primary" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </form>
  );
}
