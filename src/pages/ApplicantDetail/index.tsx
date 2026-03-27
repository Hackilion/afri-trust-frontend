import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldOff,
  Globe2,
  Fingerprint,
  Building2,
} from 'lucide-react';
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
import { Modal } from '../../components/shared/Modal';
import { DOCUMENT_LABELS, TIER_LABELS, COUNTRY_NAMES } from '../../lib/constants';
import { formatDate, formatDateTime, formatRelativeTime } from '../../lib/formatters';
import type { TimelineEvent, VerificationSession, ConsentGrant } from '../../types';
import { cn } from '../../lib/utils';
import { useSession } from '../../hooks/useSession';
import {
  APPLICANT_KIND_LABELS,
  INTAKE_CHANNEL_LABELS,
  deriveVerificationProgress,
  inferApplicantKind,
  inferIntakeChannel,
} from '../../lib/applicantPresentation';
import { organizationNameById } from '../../services/applicantService';
import {
  buildWorkflowJourney,
  getJourneyApprovalBlockers,
  isJourneyReadyForApproval,
} from '../../lib/applicantWorkflowJourney';
import { ApplicantWorkflowJourney } from '../../components/applicant/ApplicantWorkflowJourney';

const MIN_REJECTION_REASON_LEN = 12;

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
  const { can, workspaceOrgId } = useSession();
  const canWriteApplicants = can('applicants.write');
  const { data: applicant, isLoading } = useApplicant(id!);
  const { data: checks } = useApplicantChecks(id!);
  const { data: timeline } = useApplicantTimeline(id!);
  const { mutate: updateStatus, isPending } = useApplicantActions(id!, workspaceOrgId);
  const { data: sessions } = useApplicantSessions(id!);
  const { data: consents } = useApplicantConsents(id!);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState('');
  const journey = useMemo(() => {
    if (!applicant) return null;
    return buildWorkflowJourney(applicant, sessions, checks ?? undefined);
  }, [applicant, sessions, checks]);

  const approvalBlockers = useMemo(() => (journey ? getJourneyApprovalBlockers(journey) : []), [journey]);
  const journeyAllowsApproval = Boolean(journey && isJourneyReadyForApproval(journey));
  const terminalStatus = applicant?.status === 'verified' || applicant?.status === 'rejected';
  const rejectionReasonOk = rejectionReasonDraft.trim().length >= MIN_REJECTION_REASON_LEN;

  if (!workspaceOrgId) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center">
        <p className="text-sm font-semibold text-amber-900">Select a workspace</p>
        <p className="mt-2 text-xs text-amber-800/90">
          Applicants belong to a single organisation. Choose your tenant in the header to open this profile.
        </p>
        <Link to="/applicants" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to applicants
        </Link>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner className="py-32" />;
  if (!applicant) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="text-gray-700 font-medium">Applicant not found in this workspace</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          This ID may belong to another organisation, or the link is outdated. Only identities submitted to{' '}
          <span className="font-semibold text-gray-800">{organizationNameById(workspaceOrgId)}</span> appear here.
        </p>
        <Link to="/applicants" className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
          View workspace applicants
        </Link>
      </div>
    );
  }

  const persona = inferApplicantKind(applicant);
  const channel = inferIntakeChannel(applicant);
  const pipelinePct = deriveVerificationProgress(applicant);
  const crossBorder = applicant.nationality !== applicant.residenceCountry;

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
            <div className="flex flex-col items-end gap-2">
              {!journeyAllowsApproval && !terminalStatus && journey && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2 max-w-sm text-right leading-snug">
                  Approval is available only when every verification step in the journey below is finished (no failures, no open steps).
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => updateStatus({ status: 'needs_review' })}
                  disabled={isPending || terminalStatus}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Request Info
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectionReasonDraft('');
                    setRejectModalOpen(true);
                  }}
                  disabled={isPending || terminalStatus}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50 transition-colors border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(true)}
                  disabled={isPending || terminalStatus}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50 transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                  title={journeyAllowsApproval ? 'Confirm approval' : 'Review why approval is blocked'}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 max-w-sm">
              Read-only profile — your role cannot change applicant status.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex items-start gap-3 rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-3 shadow-sm sm:col-span-1 lg:col-span-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Building2 className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600/90">Organisation</p>
            <p className="text-[13px] font-semibold text-slate-900 leading-snug">
              {organizationNameById(applicant.organizationId)}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-500">{applicant.organizationId}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Fingerprint className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Persona</p>
            <p className="text-[13px] font-semibold text-slate-900">{APPLICANT_KIND_LABELS[persona]}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {persona === 'foreign_national' && 'Extra diligence on work permits & residence proof.'}
              {persona === 'minor_dependent' && 'Guardian consent and age rules apply.'}
              {persona === 'sole_trader' && 'Business-name matching may be required.'}
              {persona === 'individual' && !crossBorder && 'Standard natural-person onboarding.'}
              {persona === 'individual' && crossBorder && 'Treat as cross-border individual.'}
              {!['foreign_national', 'minor_dependent', 'sole_trader', 'individual'].includes(persona) &&
                'Follow enhanced review checklist for this profile type.'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Intake channel</p>
            <p className="text-[13px] font-semibold text-slate-900">{INTAKE_CHANNEL_LABELS[channel]}</p>
            {applicant.externalReference ? (
              <p className="mt-0.5 font-mono text-[11px] text-slate-500">Ref {applicant.externalReference}</p>
            ) : (
              <p className="mt-0.5 text-[11px] text-slate-500">No partner reference</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${pipelinePct}%` }}
                />
              </div>
              <span className="text-[12px] font-bold tabular-nums text-slate-800">{pipelinePct}%</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {applicant.documents.filter(d => d.status === 'verified').length} of {applicant.documents.length || applicant.expectedDocumentSlots || 1}{' '}
              artifacts verified
            </p>
          </div>
        </div>
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border p-3 shadow-sm',
            crossBorder ? 'border-sky-200 bg-sky-50/90' : 'border-white/80 bg-white/90'
          )}
        >
          <Globe2 className={cn('mt-0.5 h-5 w-5 shrink-0', crossBorder ? 'text-sky-600' : 'text-slate-400')} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jurisdiction</p>
            {crossBorder ? (
              <>
                <p className="text-[13px] font-semibold text-sky-950">Cross-border profile</p>
                <p className="text-[11px] text-sky-900/80">
                  Citizen of {COUNTRY_NAMES[applicant.nationality]}, residing in {COUNTRY_NAMES[applicant.residenceCountry]}.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-slate-900">Single jurisdiction</p>
                <p className="text-[11px] text-slate-500">Nationality and residence both in {COUNTRY_NAMES[applicant.nationality]}.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {journey && <ApplicantWorkflowJourney key={applicant.id} journey={journey} />}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: 3/5 */}
        <div className="lg:col-span-3 space-y-4">
          {/* Personal Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                {
                  label: 'Organisation',
                  value: (
                    <span>
                      {organizationNameById(applicant.organizationId)}{' '}
                      <span className="font-mono text-[11px] text-gray-400">({applicant.organizationId})</span>
                    </span>
                  ),
                },
                { label: 'Full Name', value: `${applicant.firstName} ${applicant.lastName}` },
                { label: 'Date of Birth', value: formatDate(applicant.dateOfBirth) },
                ...(applicant.gender
                  ? [{ label: 'Gender', value: applicant.gender.charAt(0).toUpperCase() + applicant.gender.slice(1) }]
                  : []),
                ...(applicant.occupation ? [{ label: 'Occupation', value: applicant.occupation }] : []),
                { label: 'Email', value: applicant.email },
                { label: 'Phone', value: applicant.phone },
                { label: 'Nationality', value: <span className="flex items-center gap-1.5"><CountryFlag country={applicant.nationality} /> {COUNTRY_NAMES[applicant.nationality]}</span> },
                { label: 'Residence', value: <span className="flex items-center gap-1.5"><CountryFlag country={applicant.residenceCountry} /> {COUNTRY_NAMES[applicant.residenceCountry]}</span> },
                { label: 'Address', value: `${applicant.address.street}, ${applicant.address.city}, ${applicant.address.state}` },
                { label: 'Submitted', value: formatDateTime(applicant.submittedAt) },
                ...(applicant.analystRejectionReason && applicant.status === 'rejected'
                  ? [
                      {
                        label: 'Analyst rejection reason',
                        value: <span className="text-red-700 font-normal">{applicant.analystRejectionReason}</span>,
                      },
                    ]
                  : []),
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

      <Modal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectionReasonDraft('');
        }}
        title="Reject applicant"
        description="This reason is saved on the application for audit and customer communications."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionReasonDraft('');
              }}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || !rejectionReasonOk}
              onClick={() => {
                updateStatus(
                  { status: 'rejected', note: rejectionReasonDraft.trim() },
                  {
                    onSuccess: () => {
                      setRejectModalOpen(false);
                      setRejectionReasonDraft('');
                    },
                  }
                );
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? 'Rejecting…' : 'Reject applicant'}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <label htmlFor="reject-reason" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Rejection reason
          </label>
          <textarea
            id="reject-reason"
            value={rejectionReasonDraft}
            onChange={e => setRejectionReasonDraft(e.target.value)}
            rows={4}
            placeholder="e.g. Document does not meet policy; suspected fraud; unable to verify identity…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          />
          <p className="text-[11px] text-gray-500">
            Minimum {MIN_REJECTION_REASON_LEN} characters ({rejectionReasonDraft.trim().length}/{MIN_REJECTION_REASON_LEN})
          </p>
        </div>
      </Modal>

      <Modal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve applicant"
        description={
          journeyAllowsApproval
            ? 'Only confirm when you are satisfied every verification step is complete.'
            : undefined
        }
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setApproveModalOpen(false)}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {journeyAllowsApproval ? 'Cancel' : 'Close'}
            </button>
            {journeyAllowsApproval && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  updateStatus(
                    { status: 'verified' },
                    {
                      onSuccess: () => setApproveModalOpen(false),
                    }
                  );
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPending ? 'Approving…' : 'Confirm approval'}
              </button>
            )}
          </>
        }
      >
        {journeyAllowsApproval ? (
          <p className="text-sm text-gray-600 leading-relaxed">
            Approving marks this profile as verified in your workspace. Ensure documents, automated checks, and any
            compliance review in the journey above are all in a good state.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-950 leading-snug">
                All required verification steps must be finished before you can approve. Resolve failures or wait for
                open steps to complete.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
              {approvalBlockers.map((msg, i) => (
                <li key={`${i}-${msg}`}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Document" className="max-w-full max-h-full rounded-xl shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
