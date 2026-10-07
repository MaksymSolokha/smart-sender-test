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
        <h1>Webhooks</h1>
        <SearchInput value={search} onChange={setSearch} />
      </div>

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <StateMessage title="Failed to load webhooks" tone="error">
          <p>{getErrorMessage(error)}</p>
          <button type="button" className="button" onClick={() => void refetch()}>
            Try again
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
            <span className="muted">Total: {data.paging.results.total}</span>
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
      <StateMessage title="This page does not exist">
        <button type="button" className="button" onClick={onReset}>
          Go to first page
        </button>
      </StateMessage>
    );
  }
  if (search) {
    return (
      <StateMessage title={`No webhooks match “${search}”`}>
        <button type="button" className="button" onClick={onReset}>
          Clear search
        </button>
      </StateMessage>
    );
  }
  return <StateMessage title="No webhooks yet" />;
}
