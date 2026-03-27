import type {
  Applicant,
  CheckCatalogueId,
  SessionStatus,
  SessionStep,
  VerificationCheck,
  VerificationSession,
} from '../types';
import { DOCUMENT_LABELS } from './constants';

export type JourneyPhase = 'complete' | 'current' | 'upcoming' | 'failed';

export type JourneyCheckRow = {
  id: string;
  label: string;
  status: string;
  detail?: string;
  score?: number;
};

export type WorkflowJourneyStep = {
  key: string;
  order: number;
  title: string;
  subtitle?: string;
  phase: JourneyPhase;
  startedAt?: string;
  completedAt?: string;
  checks?: JourneyCheckRow[];
};

export type WorkflowJourney = {
  source: 'verification_session' | 'inferred';
  sessionId?: string;
  workflowName: string;
  workflowVersion?: number;
  sessionStatus?: SessionStatus;
  /** Short status for operators */
  headline: string;
  subline?: string;
  steps: WorkflowJourneyStep[];
  completedSteps: number;
  totalSteps: number;
  currentStepOrder?: number;
  reviewedBy?: string;
  rejectionReason?: string;
};

const CHECK_LABELS: Record<CheckCatalogueId, string> = {
  liveness: 'Liveness',
  video_selfie: 'Video liveness',
  face_match: 'Face match',
  selfie_capture: 'Selfie capture',
  document_authenticity: 'Document authenticity',
  document_expiry: 'Document expiry',
  registry_document: 'Registry document',
  watchlist: 'Watchlist',
  pep: 'PEP',
  adverse_media: 'Adverse media',
  address_verification: 'Address',
  phone_verification: 'Phone',
  email_verification: 'Email',
  biometric_dedup: 'Biometric dedup',
  database_lookup: 'Database lookup',
};

const STEP_TYPE_TITLES: Record<string, string> = {
  document_upload: 'Document upload',
  liveness_check: 'Liveness check',
  data_form: 'Data collection',
  aml_screen: 'AML screening',
  manual_review: 'Manual review',
  webhook: 'Webhook',
  custom: 'Custom step',
};

const SESSION_STATUS_HEADLINE: Record<SessionStatus, string> = {
  created: 'Session created — awaiting applicant',
  in_progress: 'Applicant is progressing through the flow',
  processing: 'Automated checks running',
  awaiting_review: 'Waiting for your team’s review',
  approved: 'Workflow completed — approved',
  rejected: 'Workflow ended — rejected',
};

function verificationCheckLabel(type: VerificationCheck['type']): string {
  return (CHECK_LABELS as Record<string, string>)[type] ?? type.replace(/_/g, ' ');
}

function mapApplicantChecksToRows(checks: VerificationCheck[]): JourneyCheckRow[] {
  return checks.map(c => ({
    id: c.id,
    label: verificationCheckLabel(c.type),
    status: c.status,
    detail: c.failureReason ?? (c.details || undefined),
    score: c.score,
  }));
}

function mapStepStatusToPhase(status: SessionStep['status']): JourneyPhase {
  if (status === 'passed') return 'complete';
  if (status === 'failed') return 'failed';
  if (status === 'not_started') return 'upcoming';
  return 'current';
}

function sessionStepTitle(step: SessionStep): string {
  const typePart = step.stepType ? STEP_TYPE_TITLES[step.stepType] ?? step.stepType : null;
  if (typePart && step.tierProfileName) return `${typePart} · ${step.tierProfileName}`;
  if (step.tierProfileName) return step.tierProfileName;
  if (typePart) return typePart;
  return `Step ${step.order}`;
}

function findVerificationCheck(
  checks: VerificationCheck[] | undefined,
  checkId: string
): VerificationCheck | undefined {
  return checks?.find(ch => ch.type === checkId);
}

function mapSessionChecks(step: SessionStep, checks?: VerificationCheck[]): JourneyCheckRow[] {
  return step.checks.map((c, i) => {
    const v = findVerificationCheck(checks, c.checkId);
    const status = v?.status ?? c.status;
    const score = v?.score ?? c.score;
    const detail = v?.failureReason ?? v?.details ?? c.failureReason;
    return {
      id: `${step.order}-${i}-${c.checkId}`,
      label: CHECK_LABELS[c.checkId] ?? c.checkId,
      status,
      detail,
      score,
    };
  });
}

function phaseFromCheckRowStatuses(statuses: string[]): JourneyPhase {
  const norm = statuses.map(s => s.toLowerCase());
  if (norm.some(s => s === 'failed' || s === 'rejected')) return 'failed';
  if (norm.some(s => s === 'pending')) return 'current';
  if (norm.length && norm.every(s => ['passed', 'verified', 'not_applicable'].includes(s))) return 'complete';
  return 'current';
}

function stepDisplayPhase(step: SessionStep, merged: JourneyCheckRow[] | undefined): JourneyPhase {
  if (merged?.length) {
    const p = phaseFromCheckRowStatuses(merged.map(r => r.status));
    if (step.status === 'awaiting_review' && p === 'complete') return 'current';
    return p;
  }
  if (step.status === 'failed') return 'failed';
  if (step.status === 'awaiting_review') return 'current';
  return mapStepStatusToPhase(step.status);
}

function applicantHeadline(applicant: Applicant, sessionFallback: string): string {
  if (applicant.status === 'verified') return 'Verification complete';
  if (applicant.status === 'rejected') return 'Application rejected';
  if (applicant.status === 'needs_review') return 'Needs your review';
  if (applicant.status === 'incomplete') return 'Application incomplete';
  return sessionFallback;
}

function pickLatestSession(sessions: VerificationSession[] | undefined): VerificationSession | null {
  if (!sessions?.length) return null;
  return [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];
}

function journeyFromSession(
  session: VerificationSession,
  applicant: Applicant,
  checks?: VerificationCheck[]
): WorkflowJourney {
  const steps: WorkflowJourneyStep[] = session.steps.map(step => {
    const mergedChecks = step.checks.length ? mapSessionChecks(step, checks) : undefined;
    const phase = stepDisplayPhase(step, mergedChecks);
    return {
      key: `s-${session.id}-${step.order}`,
      order: step.order,
      title: sessionStepTitle(step),
      subtitle:
        step.status === 'awaiting_review'
          ? 'Needs analyst decision'
          : step.status === 'in_progress'
            ? 'In progress'
            : undefined,
      phase,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      checks: mergedChecks && mergedChecks.length ? mergedChecks : undefined,
    };
  });

  const completedSteps = steps.filter(s => s.phase === 'complete').length;
  const currentIdx = steps.findIndex(s => s.phase === 'current' || s.phase === 'failed');
  const baseHeadline = SESSION_STATUS_HEADLINE[session.status];
  const headline = applicantHeadline(applicant, baseHeadline);
  let subline = session.rejectionReason;
  if (applicant.status === 'needs_review' && !subline) {
    subline = 'This applicant is waiting for a decision from your team.';
  }

  return {
    source: 'verification_session',
    sessionId: session.id,
    workflowName: session.workflowName,
    workflowVersion: session.workflowVersion,
    sessionStatus: session.status,
    headline,
    subline,
    steps,
    completedSteps,
    totalSteps: steps.length,
    currentStepOrder: currentIdx >= 0 ? steps[currentIdx].order : session.currentStepOrder,
    reviewedBy: session.reviewedBy,
    rejectionReason: session.rejectionReason,
  };
}

function deriveInferredAutoPhase(
  applicant: Applicant,
  docPhase: JourneyPhase,
  checks: VerificationCheck[] | undefined
): JourneyPhase {
  if (docPhase === 'failed') return 'upcoming';
  if (docPhase !== 'complete') return 'upcoming';
  if (checks?.length) {
    const rel = checks.filter(c => c.status !== 'not_applicable');
    if (rel.some(c => c.status === 'failed')) return 'failed';
    if (rel.some(c => c.status === 'pending')) return 'current';
    if (rel.length && rel.every(c => c.status === 'passed')) return 'complete';
    return 'current';
  }
  if (applicant.status === 'verified') return 'complete';
  if (applicant.status === 'rejected') return 'failed';
  if (applicant.status === 'pending' || applicant.status === 'needs_review') return 'current';
  return 'upcoming';
}

function inferredHeadline(applicant: Applicant, checks?: VerificationCheck[]): string {
  const failed = checks?.find(c => c.status === 'failed');
  if (failed && applicant.status !== 'verified') {
    return 'Automated checks flagged issues';
  }
  if (applicant.status === 'verified') return 'Verification complete';
  if (applicant.status === 'rejected') return 'Application rejected';
  if (applicant.status === 'needs_review') return 'Needs your review';
  if (applicant.status === 'incomplete') return 'Application incomplete';
  return 'Verification in progress';
}

function inferredJourney(applicant: Applicant, checks?: VerificationCheck[]): WorkflowJourney {
  const docs = applicant.documents;
  const verifiedDocs = docs.filter(d => d.status === 'verified').length;
  const pendingDocs = docs.filter(d => d.status === 'pending').length;
  const rejectedDocs = docs.filter(d => d.status === 'rejected').length;
  const hasDocs = docs.length > 0;

  const step1: WorkflowJourneyStep = {
    key: 'inf-intake',
    order: 1,
    title: 'Application received',
    subtitle: 'Intake & channel routing',
    phase: 'complete',
    completedAt: applicant.submittedAt,
  };

  let docPhase: JourneyPhase = 'upcoming';
  if (applicant.status === 'incomplete' && !hasDocs) {
    docPhase = 'current';
  } else if (rejectedDocs > 0) {
    docPhase = 'failed';
  } else if (hasDocs && pendingDocs > 0) {
    docPhase = 'current';
  } else if (hasDocs && verifiedDocs === docs.length) {
    docPhase = 'complete';
  } else if (hasDocs) {
    docPhase = 'current';
  } else if (applicant.status !== 'incomplete') {
    docPhase = 'complete';
  }

  const step2: WorkflowJourneyStep = {
    key: 'inf-docs',
    order: 2,
    title: 'Document capture',
    subtitle: hasDocs ? `${verifiedDocs} verified · ${pendingDocs} pending` : 'Awaiting uploads',
    phase: docPhase,
    checks: docs.map(d => ({
      id: d.id,
      label: DOCUMENT_LABELS[d.type],
      status: d.status,
      detail: d.rejectionReason,
    })),
  };

  const autoPhase = deriveInferredAutoPhase(applicant, docPhase, checks);
  const verificationRows = checks?.length ? mapApplicantChecksToRows(checks) : undefined;
  const passedN = verificationRows?.filter(r => ['passed', 'verified'].includes(r.status.toLowerCase())).length ?? 0;
  const pendingN = verificationRows?.filter(r => r.status.toLowerCase() === 'pending').length ?? 0;
  const failedN = verificationRows?.filter(r => ['failed', 'rejected'].includes(r.status.toLowerCase())).length ?? 0;

  const step3: WorkflowJourneyStep = {
    key: 'inf-auto',
    order: 3,
    title: 'Automated verification',
    subtitle: verificationRows?.length
      ? `${passedN} passed · ${pendingN} pending${failedN ? ` · ${failedN} failed` : ''}`
      : docPhase === 'complete'
        ? 'No screening results yet — checks will appear here when they run'
        : 'Runs after documents are verified',
    phase: autoPhase,
    checks: verificationRows,
  };

  let reviewPhase: JourneyPhase = 'upcoming';
  if (applicant.status === 'needs_review') {
    reviewPhase = 'current';
  } else if (applicant.status === 'verified' || applicant.status === 'rejected') {
    reviewPhase = 'complete';
  } else if (autoPhase === 'complete' && applicant.status === 'pending') {
    reviewPhase = 'current';
  }

  const step4: WorkflowJourneyStep = {
    key: 'inf-review',
    order: 4,
    title: 'Compliance review',
    subtitle: 'Analyst queue & escalations',
    phase: reviewPhase,
  };

  let outPhase: JourneyPhase = 'upcoming';
  if (applicant.status === 'verified') {
    outPhase = 'complete';
  } else if (applicant.status === 'rejected') {
    outPhase = 'failed';
  } else if (applicant.status === 'needs_review') {
    outPhase = 'upcoming';
  }

  const step5: WorkflowJourneyStep = {
    key: 'inf-out',
    order: 5,
    title: 'Final decision',
    subtitle: 'Account / product unlock',
    phase: outPhase,
  };

  const steps = [step1, step2, step3, step4, step5];
  const completedSteps = steps.filter(s => s.phase === 'complete').length;
  const currentIdx = steps.findIndex(s => s.phase === 'current' || s.phase === 'failed');
  const headline = inferredHeadline(applicant, checks);
  const failedCheck = checks?.find(c => c.status === 'failed');

  let subline: string | undefined;
  if (applicant.status === 'rejected' && rejectedDocs) {
    subline = 'Failed at document stage';
  } else if (applicant.status === 'rejected') {
    subline = 'Failed at automated or policy stage';
  } else if (failedCheck) {
    subline = `${verificationCheckLabel(failedCheck.type)} — ${failedCheck.failureReason ?? failedCheck.details}`;
  }

  return {
    source: 'inferred',
    workflowName: 'Organisation default journey',
    headline,
    subline,
    steps,
    completedSteps,
    totalSteps: steps.length,
    currentStepOrder: currentIdx >= 0 ? steps[currentIdx].order : undefined,
  };
}

export function buildWorkflowJourney(
  applicant: Applicant,
  sessions: VerificationSession[] | undefined,
  checks?: VerificationCheck[] | undefined
): WorkflowJourney {
  const session = pickLatestSession(sessions);
  if (session) return journeyFromSession(session, applicant, checks);
  return inferredJourney(applicant, checks);
}

/** Human-readable blockers when approval is not allowed yet. */
export function getJourneyApprovalBlockers(journey: WorkflowJourney): string[] {
  const blockers: string[] = [];
  for (const s of journey.steps) {
    if (s.phase === 'failed') {
      blockers.push(`${s.title} failed or must be resolved first`);
    }
  }
  if (blockers.length) return blockers;

  if (journey.source === 'inferred') {
    const gates: { key: string; label: string }[] = [
      { key: 'inf-intake', label: 'Application received' },
      { key: 'inf-docs', label: 'Document capture' },
      { key: 'inf-auto', label: 'Automated verification' },
    ];
    for (const { key, label } of gates) {
      const step = journey.steps.find(x => x.key === key);
      if (step && step.phase !== 'complete') {
        blockers.push(`${label} must be completed before approval`);
      }
    }
    const review = journey.steps.find(x => x.key === 'inf-review');
    if (review && review.phase !== 'complete' && review.phase !== 'current') {
      blockers.push('Compliance review is not ready yet');
    }
    return blockers;
  }

  for (const s of journey.steps) {
    if (s.phase === 'upcoming') {
      blockers.push(`${s.title} is not finished yet`);
    }
  }
  return blockers;
}

export function isJourneyReadyForApproval(journey: WorkflowJourney): boolean {
  return getJourneyApprovalBlockers(journey).length === 0;
}
