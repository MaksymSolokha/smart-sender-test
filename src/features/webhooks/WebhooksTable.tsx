import { Link, useLocation } from 'react-router';
import type { Webhook } from '../../api';
import type { ListLocationState } from './listLocation';

export function WebhooksTable({ webhooks }: { webhooks: Webhook[] }) {
  const location = useLocation();
  const linkState: ListLocationState = { listSearch: location.search };

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Назва</th>
          <th>URL</th>
          <th>Активність</th>
          <th aria-label="Дії" />
        </tr>
      </thead>
      <tbody>
        {webhooks.map((webhook) => (
          <tr key={webhook.id}>
            <td>{webhook.name}</td>
            <td className="cell-url">{webhook.url}</td>
            <td>
              <span className={`badge ${webhook.active ? 'badge-on' : 'badge-off'}`}>
                {webhook.active ? 'Активний' : 'Неактивний'}
              </span>
            </td>
            <td className="cell-actions">
              <Link to={`/webhooks/${webhook.id}`} state={linkState}>
                Редагувати
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
