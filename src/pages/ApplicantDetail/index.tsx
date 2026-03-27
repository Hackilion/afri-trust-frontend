import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, MessageSquare, AlertTriangle, ChevronDown, ChevronRight, ShieldOff } from 'lucide-react';
import { useApplicant, useApplicantChecks, useApplicantTimeline } from '../../hooks/useApplicant';
import { useApplicantActions } from '../../hooks/useApplicantActions';
import { useApplicantSessions } from '../../hooks/useSessions';
import { useApplicantConsents, useConsentActions } from '../../hooks/useConsent';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { RiskScorePill } from '../../components/shared/RiskScorePill';
import { CountryFlag } from '../../components/shared/CountryFlag';
import { SessionStatusBadge } from '../../components/shared/SessionStatusBadge';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { DOCUMENT_LABELS, TIER_LABELS, COUNTRY_NAMES } from '../../lib/constants';
import { formatDate, formatDateTime, formatRelativeTime } from '../../lib/formatters';
import type { VerificationCheck, TimelineEvent, VerificationSession, ConsentGrant } from '../../types';
import { cn } from '../../lib/utils';
import { useSession } from '../../hooks/useSession';

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

function CheckRow({ check }: { check: VerificationCheck }) {
  const statusColors = { passed: 'text-emerald-700 bg-emerald-50 border-emerald-200', failed: 'text-red-700 bg-red-50 border-red-200', pending: 'text-amber-700 bg-amber-50 border-amber-200', not_applicable: 'text-gray-500 bg-gray-50 border-gray-200' };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={cn('flex-1')}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-gray-800">{CHECK_LABELS[check.type] ?? check.type}</span>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', statusColors[check.status])}>
            {check.status === 'not_applicable' ? 'N/A' : check.status.charAt(0).toUpperCase() + check.status.slice(1)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5">{check.details}</p>
        {check.failureReason && (
          <div className="flex items-start gap-1 mt-1">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600">{check.failureReason}</p>
          </div>
        )}
        {check.score !== undefined && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', check.score >= 80 ? 'bg-emerald-500' : check.score >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${check.score}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-gray-400">{check.score}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

const TIMELINE_LABELS: Record<string, string> = {
  submitted: 'Application submitted',
  document_uploaded: 'Document uploaded',
  check_completed: 'Checks completed',
  status_changed: 'Status updated',
  note_added: 'Note added',
  approved: 'Application approved',
  rejected: 'Application rejected',
  info_requested: 'More info requested',
  resubmitted: 'Application resubmitted',
};

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-[13px] font-medium text-gray-800">{TIMELINE_LABELS[event.type] ?? event.type}</p>
        <p className="text-[12px] text-gray-500">{event.description}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{formatRelativeTime(event.createdAt)}</p>
      </div>
    </div>
  );
}

const STEP_TYPE_LABELS: Record<string, string> = {
  document_upload: 'Document Upload',
  liveness_check: 'Liveness Check',
  data_form: 'Data Form',
  aml_screen: 'AML Screen',
  manual_review: 'Manual Review',
};

function SessionCard({ session }: { session: VerificationSession }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SessionStatusBadge status={session.status} />
            <span className="text-xs text-gray-500 truncate">{session.workflowName} v{session.workflowVersion}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(session.createdAt)}</p>
        </div>
        {open ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
          {session.steps.map(step => {
            const stepStatusColor = step.status === 'passed' ? 'text-emerald-600' : step.status === 'failed' ? 'text-red-600' : 'text-gray-400';
            return (
              <div key={step.order} className="flex items-center gap-2.5 text-xs">
                <span className="w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-bold flex-shrink-0">{step.order}</span>
                <span className="flex-1 text-gray-700">{step.stepType ? (STEP_TYPE_LABELS[step.stepType] ?? step.stepType) : step.tierProfileName ?? `Step ${step.order}`}</span>
                <span className={cn('font-medium', stepStatusColor)}>{step.status}</span>
              </div>
            );
          })}
          {session.rejectionReason && (
            <div className="flex items-start gap-1.5 pt-1.5 border-t border-gray-200 mt-2">
              <AlertTriangle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{session.rejectionReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConsentRow({ grant }: { grant: ConsentGrant }) {
  const { revoke } = useConsentActions();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const isExpired = new Date(grant.expiresAt) < new Date();

  return (
    <div className={cn('border rounded-lg p-3 text-xs', grant.isActive && !isExpired ? 'border-gray-100' : 'border-gray-100 opacity-60')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-[12px] truncate">{grant.grantedTo}</p>
          <p className="text-gray-500 mt-0.5">{grant.grantedToDescription}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {grant.grantedAttributes.map(a => (
              <span key={a} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">{a.replace(/_/g, ' ')}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-gray-400">
            {grant.isActive && !isExpired ? (
              <span className="text-emerald-600 font-medium">Active · expires {formatDate(grant.expiresAt)}</span>
            ) : grant.revokedAt ? (
              <span className="text-red-500">Revoked {formatDate(grant.revokedAt)}</span>
            ) : (
              <span>Expired {formatDate(grant.expiresAt)}</span>
            )}
          </div>
        </div>
        {grant.isActive && !isExpired && (
          <button
            onClick={() => setConfirmRevoke(true)}
            className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Revoke"
          >
            <ShieldOff size={13} />
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={async () => { await revoke.mutateAsync(grant.id); setConfirmRevoke(false); }}
        title="Revoke Consent"
        description={`Revoke data sharing consent for "${grant.grantedTo}"? The third party will no longer have access to this applicant's data.`}
        confirmLabel="Revoke"
        variant="danger"
        loading={revoke.isPending}
      />
    </div>
  );
}

export default function ApplicantDetail() {
  const { id } = useParams<{ id: string }>();
  const { can } = useSession();
  const canWriteApplicants = can('applicants.write');
  const { data: applicant, isLoading } = useApplicant(id!);
  const { data: checks } = useApplicantChecks(id!);
  const { data: timeline } = useApplicantTimeline(id!);
  const { mutate: updateStatus, isPending } = useApplicantActions(id!);
  const { data: sessions } = useApplicantSessions(id!);
  const { data: consents } = useApplicantConsents(id!);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approved' | 'rejected' | null>(null);

  if (isLoading) return <LoadingSpinner className="py-32" />;
  if (!applicant) return <div className="text-center py-20 text-gray-500">Applicant not found</div>;

  const handleAction = (action: 'approved' | 'rejected') => {
    if (confirmAction === action) {
      updateStatus({ status: action === 'approved' ? 'verified' : 'rejected' });
      setConfirmAction(null);
    } else {
      setConfirmAction(action);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb + Header */}
      <div>
        <Link to="/applicants" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-indigo-600 mb-3 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Applicants
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                {applicant.firstName[0]}{applicant.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{applicant.firstName} {applicant.lastName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] font-mono text-gray-400">{applicant.id}</span>
                  <span className="text-gray-200">·</span>
                  <StatusBadge status={applicant.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          {canWriteApplicants ? (
            <div className="flex items-center gap-2 flex-wrap">
              {confirmAction && (
                <span className="text-[12px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  Click again to confirm {confirmAction}
                </span>
              )}
              <button
                onClick={() => updateStatus({ status: 'needs_review' })}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Request Info
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={isPending}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50 transition-colors',
                  confirmAction === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'border border-red-200 text-red-600 hover:bg-red-50'
                )}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={isPending}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50 transition-colors',
                  confirmAction === 'approved'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 max-w-sm">
              Read-only profile — your role cannot change applicant status.
            </p>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: 3/5 */}
        <div className="lg:col-span-3 space-y-4">
          {/* Personal Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: 'Full Name', value: `${applicant.firstName} ${applicant.lastName}` },
                { label: 'Date of Birth', value: formatDate(applicant.dateOfBirth) },
                { label: 'Email', value: applicant.email },
                { label: 'Phone', value: applicant.phone },
                { label: 'Nationality', value: <span className="flex items-center gap-1.5"><CountryFlag country={applicant.nationality} /> {COUNTRY_NAMES[applicant.nationality]}</span> },
                { label: 'Residence', value: <span className="flex items-center gap-1.5"><CountryFlag country={applicant.residenceCountry} /> {COUNTRY_NAMES[applicant.residenceCountry]}</span> },
                { label: 'Address', value: `${applicant.address.city}, ${applicant.address.state}` },
                { label: 'Submitted', value: formatDateTime(applicant.submittedAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                  <p className="text-[13px] text-gray-800 mt-0.5 font-medium">{value}</p>
                </div>
              ))}
            </div>
            {applicant.tags?.length ? (
              <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-gray-50">
                {applicant.tags.map(tag => (
                  <span key={tag} className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    ⚑ {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Documents</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {applicant.documents.map(doc => (
                <div key={doc.id} className="space-y-2">
                  {doc.frontImageUrl && (
                    <button onClick={() => setLightboxUrl(doc.frontImageUrl ?? null)} className="block w-full">
                      <img src={doc.frontImageUrl} alt={`${DOCUMENT_LABELS[doc.type]} front`} className="w-full rounded-lg border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all aspect-[3/2] object-cover" />
                      <p className="text-[11px] text-gray-500 mt-1">{DOCUMENT_LABELS[doc.type]} · Front</p>
                    </button>
                  )}
                  {doc.backImageUrl && (
                    <button onClick={() => setLightboxUrl(doc.backImageUrl ?? null)} className="block w-full">
                      <img src={doc.backImageUrl} alt="Back" className="w-full rounded-lg border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all aspect-[3/2] object-cover" />
                      <p className="text-[11px] text-gray-500 mt-1">Back</p>
                    </button>
                  )}
                  {doc.selfieImageUrl && (
                    <button onClick={() => setLightboxUrl(doc.selfieImageUrl ?? null)} className="block w-full">
                      <img src={doc.selfieImageUrl} alt="Selfie" className="w-full rounded-lg border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all aspect-square object-cover" />
                      <p className="text-[11px] text-gray-500 mt-1">Selfie</p>
                    </button>
                  )}
                </div>
              ))}
              {applicant.documents.length === 0 && (
                <p className="text-[13px] text-gray-400 col-span-3 py-4">No documents uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Verification Checks */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Verification Checks</h3>
            {checks?.length ? checks.map(c => <CheckRow key={c.id} check={c} />) : <p className="text-[13px] text-gray-400 py-4">No checks run yet.</p>}
          </div>
        </div>

        {/* Right: 2/5 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Risk Score */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Risk Assessment</h3>
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-[48px] font-black text-gray-900 leading-none tracking-tight">{applicant.riskScore}</span>
                <span className="text-gray-400 text-sm">/100</span>
              </div>
              <RiskScorePill score={applicant.riskScore} level={applicant.riskLevel} showLabel />
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={cn('h-full rounded-full transition-all', applicant.riskLevel === 'low' ? 'bg-emerald-500' : applicant.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${applicant.riskScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Low risk</span><span>High risk</span>
            </div>
          </div>

          {/* Tier */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Verification Tier</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-gray-900">{TIER_LABELS[applicant.tier]}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">TIER {applicant.tier === 'basic' ? '1' : applicant.tier === 'standard' ? '2' : '3'}</span>
            </div>
            <p className="text-[12px] text-gray-500">
              {applicant.tier === 'basic' && 'Minimum identity verification for low-risk onboarding.'}
              {applicant.tier === 'standard' && 'Full document + liveness verification for financial services.'}
              {applicant.tier === 'enhanced' && 'Full KYC + PEP screening + adverse media checks.'}
            </p>
          </div>

          {/* Verification Sessions */}
          {sessions && sessions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Verification Sessions</h3>
              <div className="space-y-2">
                {sessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}

          {/* Consent Grants */}
          {consents && consents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Consent Grants</h3>
              <div className="space-y-2">
                {consents.map(c => <ConsentRow key={c.id} grant={c} />)}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Timeline</h3>
            <div>
              {timeline?.map((event, i) => (
                <TimelineItem key={event.id} event={event} isLast={i === (timeline.length - 1)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Document" className="max-w-full max-h-full rounded-xl shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
