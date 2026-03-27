import type { CompanyOnboardingDraft } from '../types/companyOnboarding';

const delay = (ms = 600) => new Promise(res => setTimeout(res, ms));

/** Mock API — replace with POST /v1/organizations/onboarding */
export async function submitCompanyOnboarding(draft: CompanyOnboardingDraft): Promise<{ id: string }> {
  await delay();
  if (!draft.legalName.trim()) throw new Error('Legal name is required');
  if (!draft.primaryCountryCode) throw new Error('Primary country is required');
  if (!draft.leadEmail.trim()) throw new Error('Work email is required');
  return { id: `ORG-ONB-${Date.now().toString(36).toUpperCase()}` };
}
