import { create } from 'zustand';

/** Demo OTP; replace with server validation in production. */
export const DEMO_EMAIL_VERIFICATION_CODE = '123456';

type State = {
  emailVerified: boolean;
  setEmailVerified: (v: boolean) => void;
  reset: () => void;
};

export const useRegistrationSessionStore = create<State>(set => ({
  emailVerified: false,
  setEmailVerified: v => set({ emailVerified: v }),
  reset: () => set({ emailVerified: false }),
}));
