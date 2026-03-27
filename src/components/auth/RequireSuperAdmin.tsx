import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';

/** Gate platform console routes. */
export function RequireSuperAdmin() {
  const { user } = useSession();
  if (user?.platformRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
