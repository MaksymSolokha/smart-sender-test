import { Spinner, StateMessage } from '../../components/StateMessage';
import { getErrorMessage } from '../../lib/errors';
import { Pagination } from './Pagination';
import { useWebhookList } from './queries';
import { SearchInput } from './SearchInput';
import { useWebhookListParams } from './useWebhookListParams';
import { WebhooksTable } from './WebhooksTable';

const PAGE_SIZE = 10;

export function WebhooksListPage() {
  const { page, search, setPage, setSearch } = useWebhookListParams();
  const { data, error, isPending, isError, isPlaceholderData, refetch } = useWebhookList({
    page,
    search,
    limit: PAGE_SIZE,
  });

  return (
    <section>
      <div className="toolbar">
        <h1>Вебхуки</h1>
        <SearchInput value={search} onChange={setSearch} />
      </div>

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <StateMessage title="Не вдалося завантажити вебхуки" tone="error">
          <p>{getErrorMessage(error)}</p>
          <button type="button" className="button" onClick={() => void refetch()}>
            Спробувати ще раз
          </button>
        </StateMessage>
      ) : data.data.length === 0 ? (
        <EmptyState
          search={search}
          isPageOutOfRange={data.paging.results.total > 0}
          onReset={() => (search ? setSearch('') : setPage(1))}
        />
      ) : (
        <div className={isPlaceholderData ? 'is-refreshing' : undefined} aria-busy={isPlaceholderData}>
          <WebhooksTable webhooks={data.data} />
          <div className="list-footer">
            <span className="muted">Знайдено: {data.paging.results.total}</span>
            <Pagination page={data.paging.pages.current} lastPage={data.paging.pages.last} onChange={setPage} />
          </div>
        </div>
      )}
    </section>
  );
}

interface EmptyStateProps {
  search: string;
  isPageOutOfRange: boolean;
  onReset: () => void;
}

function EmptyState({ search, isPageOutOfRange, onReset }: EmptyStateProps) {
  if (isPageOutOfRange) {
    return (
      <StateMessage title="Такої сторінки немає">
        <button type="button" className="button" onClick={onReset}>
          На першу сторінку
        </button>
      </StateMessage>
    );
  }
  if (search) {
    return (
      <StateMessage title={`Нічого не знайдено за запитом «${search}»`}>
        <button type="button" className="button" onClick={onReset}>
          Скинути пошук
        </button>
      </StateMessage>
    );
  }
  return <StateMessage title="Вебхуків поки немає" />;
}
