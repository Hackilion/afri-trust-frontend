import { useComplianceTiers } from '../../hooks/useSettings';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { DOCUMENT_LABELS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';

const CHECK_LABELS: Record<string, string> = {
  liveness: 'Liveness Detection',
  face_match: 'Face Match',
  document_authenticity: 'Document Authenticity',
  document_expiry: 'Document Expiry',
  watchlist: 'Watchlist Screening',
  pep: 'PEP Check',
  adverse_media: 'Adverse Media',
  address_verification: 'Address Verification',
  phone_verification: 'Phone Verification',
  email_verification: 'Email Verification',
};

const TIER_ACCENT: Record<string, string> = {
  basic: 'border-slate-200 bg-slate-50',
  standard: 'border-indigo-200 bg-indigo-50/30',
  enhanced: 'border-purple-200 bg-purple-50/30',
};

export function ComplianceTiersTab() {
  const { data: tiers, isLoading } = useComplianceTiers();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-gray-500">Configure what checks are required for each verification tier in your workflows.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers?.map(tier => (
          <div key={tier.id} className={cn('rounded-xl border p-5 space-y-4 transition-all', TIER_ACCENT[tier.name])}>
            <div className="flex items-start justify-between">
              <div>
                <span className={cn('text-[10px] font-black uppercase tracking-wider', tier.name === 'basic' ? 'text-slate-500' : tier.name === 'standard' ? 'text-indigo-600' : 'text-purple-600')}>
                  Tier {tier.name === 'basic' ? '1' : tier.name === 'standard' ? '2' : '3'}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">{tier.label}</h3>
              </div>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', tier.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200')}>
                {tier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-[12px] text-gray-600">{tier.description}</p>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Required Checks</p>
              <div className="space-y-1.5">
                {tier.requiredChecks.map(c => (
                  <div key={c} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="text-[12px] text-gray-700">{CHECK_LABELS[c] ?? c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Accepted Documents</p>
              <div className="flex flex-wrap gap-1">
                {tier.requiredDocuments.map(d => (
                  <span key={d} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">{DOCUMENT_LABELS[d]}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
