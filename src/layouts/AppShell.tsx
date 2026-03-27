import { useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { PublicLayout } from './PublicLayout';

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

export function AppShell() {
  const { pathname } = useLocation();
  if (PUBLIC_PATHS.has(pathname)) {
    return <PublicLayout />;
  }
  return <AppLayout />;
}
