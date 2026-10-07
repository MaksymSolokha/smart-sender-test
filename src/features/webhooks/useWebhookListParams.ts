import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function useWebhookListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const search = searchParams.get('search') ?? '';

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage > 1) next.set('page', String(nextPage));
        else next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const setSearch = useCallback(
    (nextSearch: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextSearch) next.set('search', nextSearch);
        else next.delete('search');
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  return { page, search, setPage, setSearch };
}
