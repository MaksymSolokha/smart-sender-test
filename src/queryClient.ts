import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !(isApiError(error) && error.status < 500) && failureCount < 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
