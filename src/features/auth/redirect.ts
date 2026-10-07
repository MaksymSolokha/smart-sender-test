import type { Location } from 'react-router';

export interface RedirectState {
  from?: Pick<Location, 'pathname' | 'search'>;
}

export function getRedirectTarget(state: unknown, fallback: string): string {
  const from = (state as RedirectState | null)?.from;
  return from ? `${from.pathname}${from.search}` : fallback;
}
