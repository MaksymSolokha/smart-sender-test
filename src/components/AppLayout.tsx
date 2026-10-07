import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { useAuth } from '../features/auth/AuthContext';

export function AppLayout() {
  const { state, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    setIsSigningOut(true);
    signOut().catch(() => setIsSigningOut(false));
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/webhooks" className="logo">Webhooks</Link>
        {state.status === 'authenticated' && (
          <div className="header-user">
            <span>{state.user.name}</span>
            <button type="button" className="button" onClick={handleSignOut} disabled={isSigningOut}>
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
