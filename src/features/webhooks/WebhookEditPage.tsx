import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { isApiError } from '../../api';
import { Spinner, StateMessage } from '../../components/StateMessage';
import { getErrorMessage } from '../../lib/errors';
import { getListPath } from './listLocation';
import { useUpdateWebhook, useWebhook } from './queries';
import { WebhookForm } from './WebhookForm';

export function WebhookEditPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  const isValidId = Number.isInteger(id) && id > 0;

  return (
    <section>
      {isValidId ? <WebhookEditor id={id} /> : <NotFound />}
    </section>
  );
}

function WebhookEditor({ id }: { id: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const listPath = getListPath(location.state);
  const { data, error, isPending, isError, refetch } = useWebhook(id);
  const updateWebhook = useUpdateWebhook(id);

  if (isPending) return <Spinner />;
  if (isError) {
    if (isApiError(error) && error.status === 404) return <NotFound listPath={listPath} />;
    return (
      <StateMessage title="Не вдалося завантажити вебхук" tone="error">
        <p>{getErrorMessage(error)}</p>
        <button type="button" className="button" onClick={() => void refetch()}>
          Спробувати ще раз
        </button>
      </StateMessage>
    );
  }

  return (
    <>
      <Link to={listPath} className="back-link">← До списку</Link>
      <h1>Редагування вебхука</h1>
      <WebhookForm
        key={data.id}
        defaultValues={{ name: data.name, url: data.url }}
        onSubmit={async (values) => {
          await updateWebhook.mutateAsync(values);
          await navigate(listPath);
        }}
        onCancel={() => void navigate(listPath)}
      />
    </>
  );
}

function NotFound({ listPath = '/webhooks' }: { listPath?: string }) {
  return (
    <StateMessage title="Вебхук не знайдено">
      <Link to={listPath}>Повернутися до списку</Link>
    </StateMessage>
  );
}
