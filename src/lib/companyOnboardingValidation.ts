import type { CompanyOnboardingDraft } from '../types/companyOnboarding';
import { STEP_COUNT } from '../store/companyOnboardingStore';

export function isOnboardingStepValid(i: number, d: CompanyOnboardingDraft): boolean {
  switch (i) {
    case 0:
      return true;
    case 1:
      return Boolean(d.archetypeId && d.employeeBandId);
    case 2:
      return Boolean(d.primaryCountryCode);
    case 3:
      return d.legalName.trim().length >= 2 && d.registrationNumber.trim().length >= 2;
    case 4:
      return Boolean(d.volumeBandId) && d.channelIds.length > 0;
    case 5: {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.leadEmail.trim());
      return (
        d.leadFirstName.trim().length >= 1 &&
        d.leadLastName.trim().length >= 1 &&
        emailOk &&
        d.leadPhoneLocal.replace(/\D/g, '').length >= 6
      );
    }
    case 6:
      return d.acceptedTerms;
    default:
      return false;
  }
}

export function onboardingCompletionPercent(d: CompanyOnboardingDraft): number {
  let n = 0;
  for (let i = 0; i < STEP_COUNT; i++) {
    if (isOnboardingStepValid(i, d)) n++;
  }
  return Math.round((n / STEP_COUNT) * 100);
}
