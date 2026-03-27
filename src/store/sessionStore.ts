import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspaceUser } from '../types/rbac';

type SessionState = {
  user: WorkspaceUser | null;
  /** Super-admin: which tenant workspace is loaded in the shell (null = platform-only surface). */
  impersonatedOrgId: string | null;
  setUser: (user: WorkspaceUser | null) => void;
  setImpersonatedOrgId: (orgId: string | null) => void;
  logout: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    set => ({
      user: null,
      impersonatedOrgId: null,
      setUser: user => set({ user }),
      setImpersonatedOrgId: impersonatedOrgId => set({ impersonatedOrgId }),
      logout: () => set({ user: null, impersonatedOrgId: null }),
    }),
    { name: 'afritrust-session' }
  )
);
