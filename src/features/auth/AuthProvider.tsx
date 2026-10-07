import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, httpClient, userApi, type Credentials } from '../../api';
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const clearLocalSession = useCallback(() => {
    queryClient.clear();
    setState({ status: 'unauthenticated' });
  }, [queryClient]);

  useEffect(() => httpClient.onSessionExpired(clearLocalSession), [clearLocalSession]);

  useEffect(() => {
    const controller = new AbortController();
    userApi
      .me(controller.signal)
      .then((user) => setState({ status: 'authenticated', user }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'unauthenticated' });
      });
    return () => controller.abort();
  }, []);

  const signIn = useCallback(async (credentials: Credentials) => {
    await authApi.signIn(credentials);
    const user = await userApi.me();
    setState({ status: 'authenticated', user });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.revoke();
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(() => ({ state, signIn, signOut }), [state, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
