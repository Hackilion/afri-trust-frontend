import type { CompanyArchetypeId } from '../lib/africanMarkets';

export type CompanyOnboardingStep =
  | 'welcome'
  | 'profile'
  | 'markets'
  | 'legal'
  | 'operations'
  | 'team'
  | 'review';

export interface CompanyOnboardingDraft {
  stepIndex: number;
  /** Organization archetype */
  archetypeId: CompanyArchetypeId | '';
  employeeBandId: string;
  /** Primary operating country ISO2 */
  primaryCountryCode: string;
  /** Additional markets (ISO2) */
  additionalCountryCodes: string[];
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  /** Optional regulator / licence reference */
  regulatoryRef: string;
  volumeBandId: string;
  channelIds: string[];
  /** Free text for edge cases */
  useCaseNotes: string;
  leadFirstName: string;
  leadLastName: string;
  leadEmail: string;
  leadPhoneLocal: string;
  acceptedTerms: boolean;
  completedAt?: string;
}

export const emptyCompanyOnboardingDraft = (): CompanyOnboardingDraft => ({
  stepIndex: 0,
  archetypeId: '',
  employeeBandId: '',
  primaryCountryCode: '',
  additionalCountryCodes: [],
  legalName: '',
  tradingName: '',
  registrationNumber: '',
  regulatoryRef: '',
  volumeBandId: '',
  channelIds: [],
  useCaseNotes: '',
  leadFirstName: '',
  leadLastName: '',
  leadEmail: '',
  leadPhoneLocal: '',
  acceptedTerms: false,
});
