export interface ListLocationState {
  listSearch?: string;
}

export function getListPath(state: unknown): string {
  const listSearch = (state as ListLocationState | null)?.listSearch;
  return `/webhooks${listSearch ?? ''}`;
}
