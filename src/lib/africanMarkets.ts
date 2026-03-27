/** African markets for org onboarding — ISO 3166-1 alpha-2, ITU dial codes, AU subregions. */

export type AfricanSubregion =
  | 'Northern Africa'
  | 'Western Africa'
  | 'Middle Africa'
  | 'Eastern Africa'
  | 'Southern Africa';

export interface AfricanCountry {
  code: string;
  name: string;
  dialCode: string;
  subregion: AfricanSubregion;
  /** Local label for company registration identifier */
  registrationLabel: string;
  registrationPlaceholder: string;
  /** Short compliance / data note for UI hints */
  complianceHint: string;
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { code: 'DZ', name: 'Algeria', dialCode: '+213', subregion: 'Northern Africa', registrationLabel: 'NIF / RC', registrationPlaceholder: 'e.g. RC or tax identifier', complianceHint: 'Align with local tax and commercial registry rules.' },
  { code: 'AO', name: 'Angola', dialCode: '+244', subregion: 'Middle Africa', registrationLabel: 'NIF', registrationPlaceholder: 'Tax identification number', complianceHint: 'Verify filings with AGT where applicable.' },
  { code: 'BJ', name: 'Benin', dialCode: '+229', subregion: 'Western Africa', registrationLabel: 'RCCM / IFU', registrationPlaceholder: 'Trade register or tax ID', complianceHint: 'RCCM extracts often required for KYB.' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', subregion: 'Southern Africa', registrationLabel: 'Company number (CIPA)', registrationPlaceholder: 'CIPA registration', complianceHint: 'CIPA registry is the primary source of truth.' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', subregion: 'Western Africa', registrationLabel: 'RCCM / IFU', registrationPlaceholder: 'Centre du formalité', complianceHint: 'Cross-check with RCCM bulletin.' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', subregion: 'Eastern Africa', registrationLabel: 'Registre de commerce', registrationPlaceholder: 'Commercial registration', complianceHint: 'Use latest commercial court extract.' },
  { code: 'CV', name: 'Cabo Verde', dialCode: '+238', subregion: 'Western Africa', registrationLabel: 'NIF', registrationPlaceholder: 'Número de identificação fiscal', complianceHint: 'NIF used across tax and banking KYB.' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', subregion: 'Middle Africa', registrationLabel: 'NIU / RCCM', registrationPlaceholder: 'Unique identification number', complianceHint: 'RCCM + tax cards are common KYB docs.' },
  { code: 'CF', name: 'Central African Republic', dialCode: '+236', subregion: 'Middle Africa', registrationLabel: 'RCCM', registrationPlaceholder: 'Trade register', complianceHint: 'Validate against RCCM where available.' },
  { code: 'TD', name: 'Chad', dialCode: '+235', subregion: 'Middle Africa', registrationLabel: 'RCCM / NIF', registrationPlaceholder: 'Commercial registration', complianceHint: 'Confirm status with local registry.' },
  { code: 'KM', name: 'Comoros', dialCode: '+269', subregion: 'Eastern Africa', registrationLabel: 'Immatriculation', registrationPlaceholder: 'Business registration', complianceHint: 'Island-specific registries may differ.' },
  { code: 'CG', name: 'Congo', dialCode: '+242', subregion: 'Middle Africa', registrationLabel: 'RCCM', registrationPlaceholder: 'Trade register number', complianceHint: 'RCCM extract for legal presence.' },
  { code: 'CD', name: 'DR Congo', dialCode: '+243', subregion: 'Middle Africa', registrationLabel: 'RCCM / ID.NAT', registrationPlaceholder: 'National identification', complianceHint: 'Large market — expect document variance by province.' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', subregion: 'Western Africa', registrationLabel: 'RCCM / CC', registrationPlaceholder: 'Centre du formalité des entreprises', complianceHint: 'CC / RCCM standard for corporate KYB.' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', subregion: 'Eastern Africa', registrationLabel: 'RCCM', registrationPlaceholder: 'Trade register', complianceHint: 'Port and logistics firms often multi-jurisdiction.' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', subregion: 'Northern Africa', registrationLabel: 'Commercial register', registrationPlaceholder: 'Registry extract number', complianceHint: 'GAFI and tax cards frequently requested.' },
  { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', subregion: 'Middle Africa', registrationLabel: 'RCCM', registrationPlaceholder: 'Registration number', complianceHint: 'Hydrocarbon sector has additional licensing.' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', subregion: 'Eastern Africa', registrationLabel: 'Business licence', registrationPlaceholder: 'Licence number', complianceHint: 'Documentation may be limited — use enhanced diligence.' },
  { code: 'SZ', name: 'Eswatini', dialCode: '+268', subregion: 'Southern Africa', registrationLabel: 'CIPC (Eswatini)', registrationPlaceholder: 'Company registration', complianceHint: 'Cross-border with SA is common.' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', subregion: 'Eastern Africa', registrationLabel: 'Trade licence / TIN', registrationPlaceholder: 'Ministry of Trade registration', complianceHint: 'Ethiopian calendar and licence renewals affect validity.' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', subregion: 'Middle Africa', registrationLabel: 'RCCM', registrationPlaceholder: 'Trade register', complianceHint: 'Oil & gas sector KYB often stricter.' },
  { code: 'GM', name: 'Gambia', dialCode: '+220', subregion: 'Western Africa', registrationLabel: 'TIN / business name', registrationPlaceholder: 'OARG registration', complianceHint: 'OARG certificate used in banking KYB.' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', subregion: 'Western Africa', registrationLabel: 'TIN / Registrar-General', registrationPlaceholder: 'e.g. C0000000000', complianceHint: 'GRA TIN and RGD documents are standard.' },
  { code: 'GN', name: 'Guinea', dialCode: '+224', subregion: 'Western Africa', registrationLabel: 'RCCM / NIF', registrationPlaceholder: 'Commercial registration', complianceHint: 'Mining sector may require ministry letters.' },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', subregion: 'Western Africa', registrationLabel: 'RCCM', registrationPlaceholder: 'Trade register', complianceHint: 'Cashew trade and ports drive many applicants.' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', subregion: 'Eastern Africa', registrationLabel: 'PIN / Company registration', registrationPlaceholder: 'e.g. P051234567X or CR number', complianceHint: 'KRA PIN and BRS search common for KYB.' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', subregion: 'Southern Africa', registrationLabel: 'Company number', registrationPlaceholder: 'Registrar registration', complianceHint: 'Often linked to South African operations.' },
  { code: 'LR', name: 'Liberia', dialCode: '+231', subregion: 'Western Africa', registrationLabel: 'BIVAC / business registry', registrationPlaceholder: 'Registration reference', complianceHint: 'Maritime registry is separate from domestic KYB.' },
  { code: 'LY', name: 'Libya', dialCode: '+218', subregion: 'Northern Africa', registrationLabel: 'Commercial registry', registrationPlaceholder: 'Registry number', complianceHint: 'Sanctions and political risk screens are critical.' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', subregion: 'Eastern Africa', registrationLabel: 'STAT / RCCM', registrationPlaceholder: 'Statistical or trade number', complianceHint: 'STAT enterprise codes used in formal sector.' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', subregion: 'Eastern Africa', registrationLabel: 'Malawi business registration', registrationPlaceholder: 'Registrar General', complianceHint: 'MRA TPN often paired with registry extract.' },
  { code: 'ML', name: 'Mali', dialCode: '+223', subregion: 'Western Africa', registrationLabel: 'RCCM / NIF', registrationPlaceholder: 'Trade register', complianceHint: 'Informal trade common — document quality varies.' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', subregion: 'Western Africa', registrationLabel: 'RCCM / NIF', registrationPlaceholder: 'Commercial registration', complianceHint: 'Mining and fisheries licensing may apply.' },
  { code: 'MU', name: 'Mauritius', dialCode: '+230', subregion: 'Eastern Africa', registrationLabel: 'BRN / company number', registrationPlaceholder: 'FSC or Registrar number', complianceHint: 'Global business companies — verify FSC vs domestic.' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', subregion: 'Northern Africa', registrationLabel: 'ICE / RC', registrationPlaceholder: 'Identifiant Commun de l’Entreprise', complianceHint: 'ICE is widely used in banking and telco KYB.' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', subregion: 'Eastern Africa', registrationLabel: 'NUIT / legal entity ID', registrationPlaceholder: 'Número Único de Identificação Tributária', complianceHint: 'Extracto da Conservatória expected.' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', subregion: 'Southern Africa', registrationLabel: 'BIPA registration', registrationPlaceholder: 'Business and IP authority', complianceHint: 'Mining and logistics hubs — cross-border with SA.' },
  { code: 'NE', name: 'Niger', dialCode: '+227', subregion: 'Western Africa', registrationLabel: 'RCCM / NIF', registrationPlaceholder: 'Trade register', complianceHint: 'Extracts may lag — confirm issue date.' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', subregion: 'Western Africa', registrationLabel: 'RC / BN / TIN', registrationPlaceholder: 'CAC RC number or BN for business name', complianceHint: 'CAC status report + TIN are typical for regulated KYB.' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', subregion: 'Eastern Africa', registrationLabel: 'TIN / RDB registration', registrationPlaceholder: 'RDB company code', complianceHint: 'RDB online registry is authoritative.' },
  { code: 'ST', name: 'São Tomé and Príncipe', dialCode: '+239', subregion: 'Middle Africa', registrationLabel: 'NIF / registry', registrationPlaceholder: 'Tax or commercial ID', complianceHint: 'Small market — enhanced source checks help.' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', subregion: 'Western Africa', registrationLabel: 'NINEA / RCCM', registrationPlaceholder: 'Numéro d’identification nationale', complianceHint: 'NINEA widely used across UEMOA banking.' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', subregion: 'Eastern Africa', registrationLabel: 'FSA / IBC number', registrationPlaceholder: 'Registry reference', complianceHint: 'IBC vs domestic entity — clarify structure early.' },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', subregion: 'Western Africa', registrationLabel: 'Corporate affairs registration', registrationPlaceholder: 'CAC reference', complianceHint: 'Extract from Corporate Affairs Commission.' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', subregion: 'Eastern Africa', registrationLabel: 'Business registration', registrationPlaceholder: 'Local licence reference', complianceHint: 'Federal vs regional licences may differ.' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', subregion: 'Southern Africa', registrationLabel: 'CIPC / registration number', registrationPlaceholder: 'e.g. K2020/123456/07', complianceHint: 'POPIA applies — document lawful processing basis.' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', subregion: 'Eastern Africa', registrationLabel: 'Business registration', registrationPlaceholder: 'Registrar reference', complianceHint: 'Operating environment may require enhanced monitoring.' },
  { code: 'SD', name: 'Sudan', dialCode: '+249', subregion: 'Northern Africa', registrationLabel: 'Commercial registry', registrationPlaceholder: 'Registry number', complianceHint: 'Sanctions screening is essential.' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', subregion: 'Eastern Africa', registrationLabel: 'TIN / BRELA', registrationPlaceholder: 'Certificate of incorporation', complianceHint: 'BRELA search + TRA TIN standard for KYB.' },
  { code: 'TG', name: 'Togo', dialCode: '+228', subregion: 'Western Africa', registrationLabel: 'RCCM / NIF', registrationPlaceholder: 'Trade register', complianceHint: 'UEMOA harmonisation — NIF format familiar to banks.' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', subregion: 'Northern Africa', registrationLabel: 'Matricule fiscale', registrationPlaceholder: 'Tax matricule', complianceHint: 'RNE extract used in formal KYB.' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', subregion: 'Eastern Africa', registrationLabel: 'TIN / URSB', registrationPlaceholder: 'Registration number', complianceHint: 'URSB and URA TIN pairing is typical.' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', subregion: 'Eastern Africa', registrationLabel: 'PACRA number', registrationPlaceholder: 'PACRA registration', complianceHint: 'PACRA certificate + TPIN for tax.' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', subregion: 'Southern Africa', registrationLabel: 'Company number (ZIMRA / registry)', registrationPlaceholder: 'Registrar of Companies', complianceHint: 'Multi-currency and liquidity context affects risk.' },
].sort((a, b) => a.name.localeCompare(b.name)) as AfricanCountry[];

export function getCountryByCode(code: string | undefined): AfricanCountry | undefined {
  if (!code) return undefined;
  return AFRICAN_COUNTRIES.find(c => c.code === code);
}

export const SUBREGIONS: AfricanSubregion[] = [
  'Northern Africa',
  'Western Africa',
  'Middle Africa',
  'Eastern Africa',
  'Southern Africa',
];

export const COMPANY_ARCHETYPES = [
  { id: 'fintech', label: 'Fintech & payments', description: 'Wallets, lending, remittance, BNPL, switches' },
  { id: 'bank', label: 'Bank & MFI', description: 'Commercial banks, microfinance, credit unions' },
  { id: 'telco', label: 'Telco & mobile money', description: 'MNOs, MVNOs, agent networks' },
  { id: 'insurance', label: 'Insurance', description: 'Underwriters, brokers, takaful' },
  { id: 'marketplace', label: 'Marketplace & commerce', description: 'E-commerce, logistics platforms' },
  { id: 'crypto', label: 'Digital assets', description: 'Exchanges, custody, on/off ramps' },
  { id: 'enterprise', label: 'Enterprise & SaaS', description: 'B2B software serving African markets' },
  { id: 'sme', label: 'SME / growth company', description: 'Scaling teams without a heavy compliance desk' },
  { id: 'ngo', label: 'NGO & development', description: 'Aid, inclusion, humanitarian programmes' },
  { id: 'public', label: 'Public sector', description: 'Agencies, regulators, state programmes' },
  { id: 'health', label: 'Health & pharma', description: 'Providers, distributors, telehealth' },
  { id: 'education', label: 'Education', description: 'Edtech, institutions, certification' },
  { id: 'energy', label: 'Energy & infrastructure', description: 'Power, renewables, construction' },
  { id: 'agri', label: 'Agriculture', description: 'Agtech, cooperatives, commodity trade' },
  { id: 'other', label: 'Other / hybrid', description: 'Conglomerates or unique operating models' },
] as const;

export type CompanyArchetypeId = (typeof COMPANY_ARCHETYPES)[number]['id'];

export const EMPLOYEE_BANDS = [
  { id: '1-10', label: '1 – 10' },
  { id: '11-50', label: '11 – 50' },
  { id: '51-200', label: '51 – 200' },
  { id: '201-1000', label: '201 – 1,000' },
  { id: '1000+', label: '1,000+' },
] as const;

export const VOLUME_BANDS = [
  { id: 'lt1k', label: 'Under 1,000 / month' },
  { id: '1k-10k', label: '1,000 – 10,000 / month' },
  { id: '10k-50k', label: '10,000 – 50,000 / month' },
  { id: '50k+', label: '50,000+ / month' },
] as const;

export const CHANNELS = [
  { id: 'web', label: 'Web onboarding' },
  { id: 'mobile', label: 'Mobile apps' },
  { id: 'api', label: 'API-only' },
  { id: 'agents', label: 'Agent / branch network' },
] as const;
