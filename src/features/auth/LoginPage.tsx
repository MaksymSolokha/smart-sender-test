import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../../components/StateMessage';
import { applyServerErrors } from '../../lib/forms';
import { useAuth } from './AuthContext';
import { loginSchema, type LoginValues } from './loginSchema';
import { getRedirectTarget } from './redirect';

const FIELDS = ['email', 'password'] as const;

export function LoginPage() {
  const { state, signIn } = useAuth();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'authenticated') {
    return <Navigate to={getRedirectTarget(location.state, '/webhooks')} replace />;
  }

  const onSubmit = handleSubmit(async (credentials) => {
    try {
      await signIn(credentials);
    } catch (error) {
      applyServerErrors(error, setError, FIELDS);
    }
  });

  return (
    <main className="auth-page">
      <form className="card form" onSubmit={onSubmit} noValidate>
        <h1>Sign in</h1>

        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="username" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <small className="field-error">{errors.email.message}</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <small className="field-error">{errors.password.message}</small>}
        </label>

        {errors.root?.server && <p className="form-error" role="alert">{errors.root.server.message}</p>}

        <button type="submit" className="button primary" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
