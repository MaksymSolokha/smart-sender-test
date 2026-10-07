import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../../components/StateMessage';
import { useAuth } from './AuthContext';
import type { RedirectState } from './redirect';

export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'unauthenticated') {
    const redirectState: RedirectState = { from: { pathname: location.pathname, search: location.search } };
    return <Navigate to="/login" replace state={redirectState} />;
  }
  return <Outlet />;
}
