import { create } from 'zustand';

/** Demo OTP; replace with server validation in production. */
export const DEMO_EMAIL_VERIFICATION_CODE = '123456';

type State = {
  emailVerified: boolean;
  /** Returned by `POST /v1/auth/register` (live API); used for `POST /v1/auth/verify-email`. */
  emailVerifyToken: string | null;
  /** Account email from step 1 (live); used for register/login, independent of onboarding contact fields. */
  pendingRegistrationEmail: string | null;
  /** Held only in memory until live registration completes. Cleared in `reset`. */
  pendingRegistrationPassword: string | null;
  setEmailVerified: (v: boolean) => void;
  setEmailVerifyToken: (t: string | null) => void;
  setPendingRegistrationEmail: (e: string | null) => void;
  setPendingRegistrationPassword: (p: string | null) => void;
  reset: () => void;
};

export const useRegistrationSessionStore = create<State>(set => ({
  emailVerified: false,
  emailVerifyToken: null,
  pendingRegistrationEmail: null,
  pendingRegistrationPassword: null,
  setEmailVerified: v => set({ emailVerified: v }),
  setEmailVerifyToken: t => set({ emailVerifyToken: t }),
  setPendingRegistrationEmail: e => set({ pendingRegistrationEmail: e }),
  setPendingRegistrationPassword: p => set({ pendingRegistrationPassword: p }),
  reset: () =>
    set({
      emailVerified: false,
      emailVerifyToken: null,
      pendingRegistrationEmail: null,
      pendingRegistrationPassword: null,
    }),
}));
