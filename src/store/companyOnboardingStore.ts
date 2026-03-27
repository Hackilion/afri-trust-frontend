import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompanyOnboardingDraft } from '../types/companyOnboarding';
import { emptyCompanyOnboardingDraft } from '../types/companyOnboarding';

type CompanyOnboardingStore = {
  draft: CompanyOnboardingDraft;
  submitted: boolean;
  setDraft: (patch: Partial<CompanyOnboardingDraft>) => void;
  setStepIndex: (i: number) => void;
  reset: () => void;
  markSubmitted: () => void;
};

export const STEP_COUNT = 7;

export const useCompanyOnboardingStore = create<CompanyOnboardingStore>()(
  persist(
    (set, get) => ({
      draft: emptyCompanyOnboardingDraft(),
      submitted: false,
      setDraft: patch =>
        set(s => ({
          draft: { ...s.draft, ...patch },
        })),
      setStepIndex: i =>
        set(s => ({
          draft: { ...s.draft, stepIndex: Math.max(0, Math.min(STEP_COUNT - 1, i)) },
        })),
      reset: () => set({ draft: emptyCompanyOnboardingDraft(), submitted: false }),
      markSubmitted: () =>
        set({
          submitted: true,
          draft: {
            ...get().draft,
            completedAt: new Date().toISOString(),
          },
        }),
    }),
    { name: 'afritrust-company-onboarding' }
  )
);
