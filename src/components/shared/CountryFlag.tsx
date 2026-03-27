import { COUNTRY_FLAGS, COUNTRY_NAMES } from '../../lib/constants';
import type { AfricanCountry } from '../../types';

interface Props { country: AfricanCountry; showName?: boolean; className?: string }

export function CountryFlag({ country, showName = false, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <span className="text-base leading-none">{COUNTRY_FLAGS[country]}</span>
      {showName && <span className="text-[13px] text-gray-700">{COUNTRY_NAMES[country]}</span>}
    </span>
  );
}
