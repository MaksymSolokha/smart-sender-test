import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { WebhookEditPage } from './features/webhooks/WebhookEditPage';
import { WebhooksListPage } from './features/webhooks/WebhooksListPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/webhooks" element={<WebhooksListPage />} />
          <Route path="/webhooks/:id" element={<WebhookEditPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/webhooks" replace />} />
    </Routes>
  );
}
