import type { DocumentType } from './applicant';
import type { CheckStatus } from './verification';

export type CheckCatalogueId =
  | 'liveness'
  | 'face_match'
  | 'document_authenticity'
  | 'document_expiry'
  | 'watchlist'
  | 'pep'
  | 'adverse_media'
  | 'address_verification'
  | 'phone_verification'
  | 'email_verification'
  | 'biometric_dedup'
  | 'database_lookup';

export type CheckCategory = 'biometric' | 'document' | 'aml' | 'contact' | 'database';

export interface CheckCatalogueEntry {
  id: CheckCatalogueId;
  name: string;
  label: string;
  description: string;
  category: CheckCategory;
  estimatedDurationSeconds: number;
  requiresDocument?: boolean;
  requiresBiometric?: boolean;
}

export interface TierProfileSettings {
  allowManualReview: boolean;
  autoApproveOnPass: boolean;
  expiryDays?: number;
  resubmissionAllowed: boolean;
  allowSelfie?: boolean;
  requireLiveness?: boolean;
}

export interface TierProfile {
  id: string;
  orgId: string;
  name: string;
  description: string;
  requiredChecks: CheckCatalogueId[];
  requiredAttributes: string[];
  acceptedDocumentTypes: DocumentType[];
  settings: TierProfileSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isArchived: boolean;
}

export type WorkflowStatus = 'draft' | 'published' | 'archived';

/** Sandbox workflows are for testing; production is default for live applicant traffic. */
export type WorkflowEnvironment = 'production' | 'sandbox';

export type WorkflowStepType =
  | 'document_upload'
  | 'liveness_check'
  | 'data_form'
  | 'aml_screen'
  | 'manual_review'
  | 'webhook'
  | 'custom';

/** Persisted edge between two step nodes (not including the virtual start node). */
export interface WorkflowGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowStep {
  /** Stable id for graph editor, persistence, and integrations. */
  nodeId: string;
  order: number;
  stepType: WorkflowStepType;
  tierProfileId?: string;
  tierProfile?: TierProfile;
  label?: string;
  isOptional?: boolean;
  required?: boolean;
  checks?: CheckCatalogueId[];
  /** Canvas coordinates (React Flow). */
  position?: { x: number; y: number };
  /** For `custom` / `webhook`: key your backend or partner system can branch on. */
  integrationKey?: string;
  /** Arbitrary JSON-safe payload for custom connectors (URLs, headers IDs, etc.). */
  metadata?: Record<string, unknown>;
}

/** Payload when adding a step; `nodeId` is assigned server-side if omitted. */
export type WorkflowStepCreate = Omit<WorkflowStep, 'order' | 'nodeId'> & {
  nodeId?: string;
};

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  /** Explicit DAG between steps. When omitted or empty, a linear chain by `order` is assumed. */
  edges?: WorkflowGraphEdge[];
  version: number;
  /** Defaults to production when omitted (legacy mocks). */
  environment?: WorkflowEnvironment;
  /** Free-form labels for routing, reporting, or multi-brand orgs (e.g. region, product line). */
  tags?: string[];
  /** Optional vertical for templates and analytics (any string; UI suggests common values). */
  industryVertical?: string;
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  clonedFromId?: string;
}

export type SessionStatus =
  | 'created'
  | 'in_progress'
  | 'processing'
  | 'awaiting_review'
  | 'approved'
  | 'rejected';

export type StepStatus = 'not_started' | 'in_progress' | 'passed' | 'failed' | 'awaiting_review' | 'pending';

export interface SessionStepCheckStatus {
  checkId: CheckCatalogueId;
  status: CheckStatus;
  score?: number;
  failureReason?: string;
  completedAt?: string;
}

export interface SessionStep {
  order: number;
  stepType?: WorkflowStepType;
  tierProfileId?: string;
  tierProfileName?: string;
  status: StepStatus;
  checks: SessionStepCheckStatus[];
  startedAt?: string;
  completedAt?: string;
}

export interface VerificationSession {
  id: string;
  applicantId: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  status: SessionStatus;
  currentStepOrder: number;
  steps: SessionStep[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}
