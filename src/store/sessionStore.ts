import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspaceUser } from '../types/rbac';

type SessionState = {
  user: WorkspaceUser | null;
  /** Super-admin: which tenant workspace is loaded in the shell (null = platform-only surface). */
  impersonatedOrgId: string | null;
  /** JWT from `afri-trust-backend` when using live API */
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: WorkspaceUser | null) => void;
  setImpersonatedOrgId: (orgId: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setAuthTokens: (access: string | null, refresh: string | null) => void;
  logout: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    set => ({
      user: null,
      impersonatedOrgId: null,
      accessToken: null,
      refreshToken: null,
      setUser: user => set({ user }),
      setImpersonatedOrgId: impersonatedOrgId => set({ impersonatedOrgId }),
      setAccessToken: accessToken => set({ accessToken }),
      setAuthTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () =>
        set({ user: null, impersonatedOrgId: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'afritrust-session-v2' }
  )
);
