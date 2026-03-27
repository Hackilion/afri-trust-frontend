import { Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { PublicLayout } from './PublicLayout';
import { useSessionStore } from '../store/sessionStore';

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/verify-email', '/accept-invite']);

export function AppShell() {
  const { pathname } = useLocation();
  const user = useSessionStore(s => s.user);

  if (PUBLIC_PATHS.has(pathname)) {
    return <PublicLayout />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }

  return <AppLayout />;
}
