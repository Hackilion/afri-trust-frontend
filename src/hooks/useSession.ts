import { useMemo } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { getCapabilities, getWorkspaceOrgId, type Capability } from '../lib/capabilities';

export function useSession() {
  const user = useSessionStore(s => s.user);
  const impersonatedOrgId = useSessionStore(s => s.impersonatedOrgId);
  const setUser = useSessionStore(s => s.setUser);
  const setImpersonatedOrgId = useSessionStore(s => s.setImpersonatedOrgId);
  const logout = useSessionStore(s => s.logout);

  const workspaceOrgId = useMemo(() => getWorkspaceOrgId(user, impersonatedOrgId), [user, impersonatedOrgId]);

  const capabilities = useMemo(
    () => getCapabilities(user, impersonatedOrgId),
    [user, impersonatedOrgId]
  );

  const can = (c: Capability) => capabilities[c];

  return {
    user,
    impersonatedOrgId,
    setUser,
    setImpersonatedOrgId,
    logout,
    workspaceOrgId,
    capabilities,
    can,
    isSuperAdmin: user?.platformRole === 'super_admin',
  };
}
