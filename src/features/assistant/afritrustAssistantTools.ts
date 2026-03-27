/**
 * OpenAI-style tools for the in-browser WebLLM assistant.
 * Handlers use the same JWT session as the rest of the dashboard (apiFetch).
 */
import type { ChatCompletionTool } from '@mlc-ai/web-llm';

import { apiFetch } from '../../lib/apiClient';
import {
  apiAddWorkflowStep,
  apiArchiveTierProfile,
  apiArchiveWorkflow,
  apiCheckCatalogue,
  apiCloneWorkflow,
  apiCreateTierProfile,
  apiCreateWorkflow,
  apiGetTierProfile,
  apiGetWorkflow,
  apiListTierProfiles,
  apiListWorkflows,
  apiPublishWorkflow,
  apiRemoveWorkflowStep,
  apiUpdateTierProfile,
  apiUpdateWorkflow,
  type BackendAttributeSchemaRow,
} from '../../services/workflowBackendApi';
import { createVerificationSession, listVerifications } from '../../services/verificationService';
import { backendGetVerificationDetail } from '../../services/backendApplicantsService';

/**
 * Hermes-2-Pro is required for reliable WebLLM tool calling: it injects the official
 * function-calling system prompt and JSON grammar. Hermes-3 + custom system + tools can
 * emit plain text and crash JSON parsing inside the engine.
 */
export const ASSISTANT_MODEL_DEFAULT = 'Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC';

export { AFRI_ASSISTANT_SYSTEM_PROMPT } from './afritrustAssistantSystemPrompt';

export const afritrustAssistantTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_workflows',
      description: 'List workflows for the org. Optional filter by status: draft, published, archived.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'draft | published | archived' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_workflow',
      description: 'Get workflow detail including steps.',
      parameters: {
        type: 'object',
        properties: { workflow_id: { type: 'string' } },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_workflow',
      description:
        'Create a draft workflow only when the user explicitly asked to create a workflow (not when they only asked for a tier profile).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_workflow_step',
      description:
        'Add a step to a draft workflow only when the user explicitly asked to add a workflow step or build a workflow.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
          tier_profile_id: { type: 'string' },
          step_order: { type: 'integer' },
          is_optional: { type: 'boolean' },
        },
        required: ['workflow_id', 'tier_profile_id', 'step_order'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'publish_workflow',
      description:
        'Publish a draft workflow only when the user explicitly asked to publish. Required before starting verifications, but do not publish unless they asked.',
      parameters: {
        type: 'object',
        properties: { workflow_id: { type: 'string' } },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tier_profiles',
      description:
        'List tier profiles for the org. Call before creating a tier with a specific name to avoid duplicates; use exact names and ids from the response.',
      parameters: {
        type: 'object',
        properties: {
          include_archived: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_check_catalogue',
      description:
        'Returns allowed values for required_checks, accepted_document_types, and attribute data_type. Call before create_tier_profile or update_tier_profile so you only use valid enum strings.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_tier_profile',
      description:
        'Create a new tier profile (verification template). Use when the user asks to create a tier/tire/tier profile. Include only the checks, attributes, and document types they asked for — nothing extra. Prefer calling get_check_catalogue first.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Display name exactly as the user requested' },
          description: { type: 'string' },
          required_checks: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Subset of check types from get_check_catalogue (e.g. email, phone). Omit checks the user did not ask to run. Use [] only if they want attributes only with no verification checks.',
          },
          attribute_schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string', description: 'Snake_case identifier, e.g. email, phone_number, address' },
                label: { type: 'string' },
                data_type: { type: 'string', description: 'From get_check_catalogue attribute_data_types' },
                required: { type: 'boolean' },
                description: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
              },
              required: ['key', 'label', 'data_type'],
            },
            description: 'One entry per field the user asked to collect (e.g. email, phone, address).',
          },
          accepted_document_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'From get_check_catalogue document_types; use [] if user did not ask for ID uploads.',
          },
          settings: { type: 'object', description: 'Usually {}' },
        },
        required: ['name', 'required_checks', 'attribute_schema'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tier_profile',
      description: 'Fetch one tier profile by id (from list_tier_profiles).',
      parameters: {
        type: 'object',
        properties: { tier_profile_id: { type: 'string' } },
        required: ['tier_profile_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_tier_profile',
      description:
        'Update an existing tier profile only when the user explicitly asked to change that tier. Cannot change tiers referenced by published workflows.',
      parameters: {
        type: 'object',
        properties: {
          tier_profile_id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          required_checks: { type: 'array', items: { type: 'string' } },
          attribute_schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                data_type: { type: 'string' },
                required: { type: 'boolean' },
                description: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
              },
              required: ['key', 'label', 'data_type'],
            },
          },
          accepted_document_types: { type: 'array', items: { type: 'string' } },
          settings: { type: 'object' },
        },
        required: ['tier_profile_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_verifications',
      description:
        'Paginated verification sessions (KYC registry). Filter by applicant_id, workflow_id, status, or result.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          page_size: { type: 'integer' },
          status: { type: 'string' },
          result: { type: 'string', description: 'e.g. approved, rejected, pending' },
          applicant_id: { type: 'string' },
          workflow_id: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_verification_detail',
      description: 'Full verification session with steps.',
      parameters: {
        type: 'object',
        properties: { session_id: { type: 'string' } },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_verification_required_data',
      description: 'What the current verification step still needs (checks, attributes, documents).',
      parameters: {
        type: 'object',
        properties: { session_id: { type: 'string' } },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_applicant',
      description: 'Create an applicant record only when the user explicitly asked to add or create an applicant.',
      parameters: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          external_id: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_verification_session',
      description:
        'Start a verification only when the user explicitly asked. Requires applicant_id and exactly one of workflow_id (UUID) or workflow_code (6-digit published workflow short code).',
      parameters: {
        type: 'object',
        properties: {
          applicant_id: { type: 'string' },
          workflow_id: { type: 'string', description: 'UUID of a published workflow' },
          workflow_code: { type: 'string', description: '6-digit short_code of a published workflow' },
        },
        required: ['applicant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_webhooks',
      description: 'List webhook subscriptions (owner/admin).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_api_keys',
      description: 'List API keys metadata (owner/admin).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_user',
      description: 'Current JWT user profile (email, org, role).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_org_settings',
      description: 'Organisation name and branding settings.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_org_users',
      description: 'Team members in the org (email, role, invite status).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_applicants',
      description:
        'Paginated applicants registry (KYC data API). Supports search; optional status/workflow_id when the API filters by them.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          page_size: { type: 'integer' },
          search: { type: 'string', description: 'Matches name, email, phone, external_id' },
          status: { type: 'string' },
          workflow_id: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_applicant',
      description: 'Single applicant by id.',
      parameters: {
        type: 'object',
        properties: { applicant_id: { type: 'string' } },
        required: ['applicant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_applicant',
      description: 'Update applicant fields when the user explicitly asked.',
      parameters: {
        type: 'object',
        properties: {
          applicant_id: { type: 'string' },
          full_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
        },
        required: ['applicant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_applicant',
      description: 'Delete an applicant only when the user explicitly asked to remove them.',
      parameters: {
        type: 'object',
        properties: { applicant_id: { type: 'string' } },
        required: ['applicant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_applicant_kyc_summary',
      description: 'Rich KYC view: all verification sessions for an applicant with steps, documents, biometrics.',
      parameters: {
        type: 'object',
        properties: { applicant_id: { type: 'string' } },
        required: ['applicant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_workflow_by_short_code',
      description: 'Resolve a published workflow by its 6-digit org short_code (returns full workflow with steps).',
      parameters: {
        type: 'object',
        properties: { short_code: { type: 'string' } },
        required: ['short_code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_workflow',
      description: 'Update draft workflow name/description when the user asked.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_draft_workflow',
      description: 'Permanently delete a draft workflow only when explicitly requested.',
      parameters: {
        type: 'object',
        properties: { workflow_id: { type: 'string' } },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'archive_workflow',
      description: 'Move a published workflow to archived when the user asked.',
      parameters: {
        type: 'object',
        properties: { workflow_id: { type: 'string' } },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clone_workflow',
      description: 'Duplicate a workflow as a new draft (copy) when the user asked.',
      parameters: {
        type: 'object',
        properties: { workflow_id: { type: 'string' } },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_workflow_steps',
      description: 'List steps for a workflow (tier_profile_id, step_order per step).',
      parameters: {
        type: 'object',
        properties: { workflow_id: { type: 'string' } },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_workflow_step',
      description: 'Update step_order or is_optional on a draft workflow step.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
          step_id: { type: 'string' },
          step_order: { type: 'integer' },
          is_optional: { type: 'boolean' },
        },
        required: ['workflow_id', 'step_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_workflow_step',
      description: 'Remove a step from a draft workflow when the user asked.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
          step_id: { type: 'string' },
        },
        required: ['workflow_id', 'step_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'archive_tier_profile',
      description: 'Archive (soft-delete) a tier profile when explicitly requested; fails if used by a published workflow.',
      parameters: {
        type: 'object',
        properties: { tier_profile_id: { type: 'string' } },
        required: ['tier_profile_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_webhook',
      description: 'Subscribe a webhook URL to event_types. signing_secret is returned once — show it to the user.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          event_types: { type: 'array', items: { type: 'string' } },
        },
        required: ['url', 'event_types'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_webhook',
      description: 'Update webhook url, event_types, or is_active.',
      parameters: {
        type: 'object',
        properties: {
          webhook_id: { type: 'string' },
          url: { type: 'string' },
          event_types: { type: 'array', items: { type: 'string' } },
          is_active: { type: 'boolean' },
        },
        required: ['webhook_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_webhook',
      description: 'Delete a webhook subscription when explicitly requested.',
      parameters: {
        type: 'object',
        properties: { webhook_id: { type: 'string' } },
        required: ['webhook_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_webhook_deliveries',
      description: 'Recent delivery attempts for a webhook (payload, status, HTTP code).',
      parameters: {
        type: 'object',
        properties: { webhook_id: { type: 'string' } },
        required: ['webhook_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'test_webhook',
      description: 'Send a test payload to the webhook endpoint.',
      parameters: {
        type: 'object',
        properties: { webhook_id: { type: 'string' } },
        required: ['webhook_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_api_key',
      description:
        'Create an API key; raw key is returned once only — warn the user to copy it. Requires explicit user request.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string' }, description: 'Often [] for default' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'revoke_api_key',
      description: 'Revoke (deactivate) an API key when explicitly requested.',
      parameters: {
        type: 'object',
        properties: { key_id: { type: 'string' } },
        required: ['key_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_audit_logs',
      description: 'Paginated audit trail for the org (actions on resources).',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          page_size: { type: 'integer' },
          action: { type: 'string' },
          resource_type: { type: 'string' },
          resource_id: { type: 'string' },
          after: { type: 'string', description: 'ISO-8601 datetime' },
          before: { type: 'string', description: 'ISO-8601 datetime' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Summary KPIs: applicants, verifications, approval rate, breakdowns by status/tier/workflow.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_timeseries',
      description: 'Daily verification counts/outcomes over the last N days.',
      parameters: {
        type: 'object',
        properties: { days: { type: 'integer', description: '1–365, default 30' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_funnel',
      description: 'Verification funnel metrics and per-step counts for a time window; optional workflow_id filter.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'integer' },
          workflow_id: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_document_stats',
      description: 'Document and biometric processing aggregates for the org.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_verification_steps',
      description: 'Step progress rows for a verification session (status, checks_completed per step).',
      parameters: {
        type: 'object',
        properties: { session_id: { type: 'string' } },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'submit_verification_review',
      description: 'Human approve/reject for a session in review (decision: approve | reject).',
      parameters: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          decision: { type: 'string', enum: ['approve', 'reject'] },
          reason: { type: 'string' },
        },
        required: ['session_id', 'decision'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_consents',
      description: 'Consent grants for data sharing linked to applicants/sessions.',
      parameters: {
        type: 'object',
        properties: {
          active_only: { type: 'boolean', description: 'If true, only non-revoked and unexpired' },
        },
      },
    },
  },
];

function safeParseArgs(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw || '{}') as unknown;
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (typeof v === 'boolean') {
      q.set(k, v ? 'true' : 'false');
      continue;
    }
    if (typeof v === 'string' && v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

function normalizeAttributeRow(row: unknown): BackendAttributeSchemaRow | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const key = String(r.key ?? '').trim();
  if (!key) return null;
  const label = String(r.label ?? key).trim();
  const data_type = String(r.data_type ?? 'string').trim();
  const out: BackendAttributeSchemaRow = {
    key,
    label,
    data_type,
    required: r.required !== false,
  };
  if (r.description != null) out.description = String(r.description);
  if (Array.isArray(r.options)) out.options = r.options.map(String);
  return out;
}

export async function executeAssistantTool(name: string, argsJson: string): Promise<string> {
  const args = safeParseArgs(argsJson);
  try {
    switch (name) {
      case 'list_workflows': {
        const status = typeof args.status === 'string' ? args.status : undefined;
        const rows = await apiListWorkflows(status);
        return JSON.stringify({ ok: true, workflows: rows });
      }
      case 'get_workflow': {
        const id = String(args.workflow_id ?? '');
        const wf = await apiGetWorkflow(id);
        return JSON.stringify({ ok: true, workflow: wf });
      }
      case 'create_workflow': {
        const wf = await apiCreateWorkflow({
          name: String(args.name ?? 'Untitled'),
          description: args.description != null ? String(args.description) : null,
        });
        return JSON.stringify({ ok: true, workflow: wf });
      }
      case 'add_workflow_step': {
        const step = await apiAddWorkflowStep(String(args.workflow_id ?? ''), {
          tier_profile_id: String(args.tier_profile_id ?? ''),
          step_order: Number(args.step_order ?? 1),
          is_optional: Boolean(args.is_optional),
        });
        return JSON.stringify({ ok: true, step });
      }
      case 'publish_workflow': {
        const wf = await apiPublishWorkflow(String(args.workflow_id ?? ''));
        return JSON.stringify({ ok: true, workflow: wf });
      }
      case 'list_tier_profiles': {
        const inc = Boolean(args.include_archived);
        const rows = await apiListTierProfiles({ includeInactive: inc });
        return JSON.stringify({ ok: true, tier_profiles: rows });
      }
      case 'get_check_catalogue': {
        const cat = await apiCheckCatalogue();
        return JSON.stringify({ ok: true, catalogue: cat });
      }
      case 'create_tier_profile': {
        const name = String(args.name ?? '').trim();
        if (!name) return JSON.stringify({ ok: false, error: 'name is required' });
        const required_checks = Array.isArray(args.required_checks)
          ? args.required_checks.map(x => String(x).trim()).filter(Boolean)
          : [];
        const attribute_schema = Array.isArray(args.attribute_schema)
          ? (args.attribute_schema
              .map(normalizeAttributeRow)
              .filter((x): x is BackendAttributeSchemaRow => x != null))
          : [];
        const accepted_document_types = Array.isArray(args.accepted_document_types)
          ? args.accepted_document_types.map(x => String(x).trim()).filter(Boolean)
          : [];
        const settings =
          args.settings && typeof args.settings === 'object' && !Array.isArray(args.settings)
            ? (args.settings as Record<string, unknown>)
            : {};
        const tp = await apiCreateTierProfile({
          name,
          description: args.description != null ? String(args.description) : null,
          required_checks,
          attribute_schema,
          accepted_document_types,
          settings,
        });
        return JSON.stringify({ ok: true, tier_profile: tp });
      }
      case 'get_tier_profile': {
        const id = String(args.tier_profile_id ?? '').trim();
        const tp = await apiGetTierProfile(id);
        return JSON.stringify({ ok: true, tier_profile: tp });
      }
      case 'update_tier_profile': {
        const id = String(args.tier_profile_id ?? '').trim();
        if (!id) return JSON.stringify({ ok: false, error: 'tier_profile_id is required' });
        const body: {
          name?: string | null;
          description?: string | null;
          required_checks?: string[];
          attribute_schema?: BackendAttributeSchemaRow[];
          accepted_document_types?: string[];
          settings?: Record<string, unknown>;
        } = {};
        if (typeof args.name === 'string') body.name = args.name;
        if (args.description !== undefined)
          body.description = args.description != null ? String(args.description) : null;
        if (Array.isArray(args.required_checks))
          body.required_checks = args.required_checks.map(x => String(x).trim()).filter(Boolean);
        if (Array.isArray(args.attribute_schema))
          body.attribute_schema = args.attribute_schema
            .map(normalizeAttributeRow)
            .filter((x): x is BackendAttributeSchemaRow => x != null);
        if (Array.isArray(args.accepted_document_types))
          body.accepted_document_types = args.accepted_document_types
            .map(x => String(x).trim())
            .filter(Boolean);
        if (args.settings && typeof args.settings === 'object' && !Array.isArray(args.settings))
          body.settings = args.settings as Record<string, unknown>;
        if (Object.keys(body).length === 0)
          return JSON.stringify({ ok: false, error: 'Provide at least one field to update' });
        const tp = await apiUpdateTierProfile(id, body);
        return JSON.stringify({ ok: true, tier_profile: tp });
      }
      case 'list_verifications': {
        const page = await listVerifications({
          page: args.page != null ? Number(args.page) : 1,
          page_size: args.page_size != null ? Number(args.page_size) : 25,
          status: typeof args.status === 'string' ? args.status : undefined,
          result: typeof args.result === 'string' ? args.result : undefined,
          applicant_id: typeof args.applicant_id === 'string' ? args.applicant_id : undefined,
          workflow_id: typeof args.workflow_id === 'string' ? args.workflow_id : undefined,
        });
        return JSON.stringify({ ok: true, ...page });
      }
      case 'get_verification_detail': {
        const sid = String(args.session_id ?? '');
        const detail = await backendGetVerificationDetail(sid);
        return JSON.stringify({ ok: true, verification: detail });
      }
      case 'get_verification_required_data': {
        const sid = String(args.session_id ?? '');
        const data = await apiFetch<unknown>(`/v1/verifications/${sid}/required-data`);
        return JSON.stringify({ ok: true, required_data: data });
      }
      case 'create_applicant': {
        const body = {
          full_name: args.full_name != null ? String(args.full_name) : null,
          email: args.email != null ? String(args.email) : null,
          phone: args.phone != null ? String(args.phone) : null,
          external_id: args.external_id != null ? String(args.external_id) : null,
          metadata: {},
        };
        const created = await apiFetch<Record<string, unknown>>('/v1/applicants', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return JSON.stringify({ ok: true, applicant: created });
      }
      case 'create_verification_session': {
        const applicantId = String(args.applicant_id ?? '').trim();
        const workflow_id =
          args.workflow_id != null && String(args.workflow_id).trim() !== ''
            ? String(args.workflow_id).trim()
            : '';
        const workflow_code =
          args.workflow_code != null && String(args.workflow_code).trim() !== ''
            ? String(args.workflow_code).trim()
            : '';
        if (!applicantId) return JSON.stringify({ ok: false, error: 'applicant_id is required' });
        if ((workflow_id && workflow_code) || (!workflow_id && !workflow_code)) {
          return JSON.stringify({
            ok: false,
            error: 'Provide exactly one of workflow_id or workflow_code (6-digit published code)',
          });
        }
        const session = await createVerificationSession(
          applicantId,
          workflow_code ? { workflow_code } : { workflow_id }
        );
        return JSON.stringify({ ok: true, verification: session });
      }
      case 'list_webhooks': {
        const rows = await apiFetch<unknown[]>('/v1/webhooks');
        return JSON.stringify({ ok: true, webhooks: rows });
      }
      case 'list_api_keys': {
        const rows = await apiFetch<unknown[]>('/v1/api-keys');
        return JSON.stringify({ ok: true, api_keys: rows });
      }
      case 'get_current_user': {
        const me = await apiFetch<unknown>('/v1/auth/me');
        return JSON.stringify({ ok: true, user: me });
      }
      case 'get_org_settings': {
        const s = await apiFetch<unknown>('/v1/org/settings');
        return JSON.stringify({ ok: true, org_settings: s });
      }
      case 'list_org_users': {
        const users = await apiFetch<unknown[]>('/v1/org/users');
        return JSON.stringify({ ok: true, users });
      }
      case 'list_applicants': {
        const q = toQuery({
          page: args.page != null ? Number(args.page) : 1,
          page_size: args.page_size != null ? Number(args.page_size) : 25,
          search: typeof args.search === 'string' ? args.search : undefined,
          status: typeof args.status === 'string' ? args.status : undefined,
          workflow_id: typeof args.workflow_id === 'string' ? args.workflow_id : undefined,
        });
        const page = await apiFetch<unknown>(`/v1/applicants${q}`);
        return JSON.stringify({ ok: true, ...((page as object) || {}) });
      }
      case 'get_applicant': {
        const id = String(args.applicant_id ?? '').trim();
        const a = await apiFetch<unknown>(`/v1/applicants/${id}`);
        return JSON.stringify({ ok: true, applicant: a });
      }
      case 'update_applicant': {
        const id = String(args.applicant_id ?? '').trim();
        const body: Record<string, unknown> = {};
        if (typeof args.full_name === 'string') body.full_name = args.full_name;
        if (typeof args.email === 'string') body.email = args.email;
        if (typeof args.phone === 'string') body.phone = args.phone;
        if (Object.keys(body).length === 0)
          return JSON.stringify({ ok: false, error: 'Provide at least one of full_name, email, phone' });
        const a = await apiFetch<unknown>(`/v1/applicants/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        return JSON.stringify({ ok: true, applicant: a });
      }
      case 'delete_applicant': {
        const id = String(args.applicant_id ?? '').trim();
        await apiFetch<{ detail?: string }>(`/v1/applicants/${id}`, { method: 'DELETE' });
        return JSON.stringify({ ok: true, detail: 'Applicant deleted' });
      }
      case 'get_applicant_kyc_summary': {
        const id = String(args.applicant_id ?? '').trim();
        const summary = await apiFetch<unknown>(`/v1/applicants/${id}/kyc-summary`);
        return JSON.stringify({ ok: true, kyc_summary: summary });
      }
      case 'get_workflow_by_short_code': {
        const code = String(args.short_code ?? '').trim();
        if (code.length !== 6 || !/^\d+$/.test(code)) {
          return JSON.stringify({ ok: false, error: 'short_code must be exactly 6 digits' });
        }
        const wf = await apiFetch<unknown>(`/v1/workflows/by-code/${encodeURIComponent(code)}`);
        return JSON.stringify({ ok: true, workflow: wf });
      }
      case 'update_workflow': {
        const id = String(args.workflow_id ?? '').trim();
        const body: { name?: string | null; description?: string | null } = {};
        if (typeof args.name === 'string') body.name = args.name;
        if (args.description !== undefined)
          body.description = args.description != null ? String(args.description) : null;
        if (Object.keys(body).length === 0)
          return JSON.stringify({ ok: false, error: 'Provide name and/or description' });
        const wf = await apiUpdateWorkflow(id, body);
        return JSON.stringify({ ok: true, workflow: wf });
      }
      case 'delete_draft_workflow': {
        const id = String(args.workflow_id ?? '').trim();
        await apiFetch<{ detail?: string }>(`/v1/workflows/${id}`, { method: 'DELETE' });
        return JSON.stringify({ ok: true, detail: 'Workflow deleted' });
      }
      case 'archive_workflow': {
        const id = String(args.workflow_id ?? '').trim();
        const wf = await apiArchiveWorkflow(id);
        return JSON.stringify({ ok: true, workflow: wf });
      }
      case 'clone_workflow': {
        const id = String(args.workflow_id ?? '').trim();
        const wf = await apiCloneWorkflow(id);
        return JSON.stringify({ ok: true, workflow: wf });
      }
      case 'list_workflow_steps': {
        const id = String(args.workflow_id ?? '').trim();
        const steps = await apiFetch<unknown[]>(`/v1/workflows/${id}/steps`);
        return JSON.stringify({ ok: true, steps });
      }
      case 'update_workflow_step': {
        const wf = String(args.workflow_id ?? '').trim();
        const sid = String(args.step_id ?? '').trim();
        const body: Record<string, unknown> = {};
        if (args.step_order != null) body.step_order = Number(args.step_order);
        if (args.is_optional !== undefined) body.is_optional = Boolean(args.is_optional);
        if (Object.keys(body).length === 0)
          return JSON.stringify({ ok: false, error: 'Provide step_order and/or is_optional' });
        const step = await apiFetch<unknown>(`/v1/workflows/${wf}/steps/${sid}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        return JSON.stringify({ ok: true, step });
      }
      case 'remove_workflow_step': {
        const wf = String(args.workflow_id ?? '').trim();
        const sid = String(args.step_id ?? '').trim();
        await apiRemoveWorkflowStep(wf, sid);
        return JSON.stringify({ ok: true, detail: 'Step removed' });
      }
      case 'archive_tier_profile': {
        const id = String(args.tier_profile_id ?? '').trim();
        await apiArchiveTierProfile(id);
        return JSON.stringify({ ok: true, detail: 'Tier profile archived' });
      }
      case 'create_webhook': {
        const url = String(args.url ?? '').trim();
        const event_types = Array.isArray(args.event_types) ? args.event_types.map(String) : [];
        const created = await apiFetch<unknown>('/v1/webhooks', {
          method: 'POST',
          body: JSON.stringify({ url, event_types }),
        });
        return JSON.stringify({ ok: true, webhook: created });
      }
      case 'update_webhook': {
        const wid = String(args.webhook_id ?? '').trim();
        const body: Record<string, unknown> = {};
        if (typeof args.url === 'string') body.url = args.url;
        if (Array.isArray(args.event_types)) body.event_types = args.event_types.map(String);
        if (args.is_active !== undefined) body.is_active = Boolean(args.is_active);
        if (Object.keys(body).length === 0)
          return JSON.stringify({ ok: false, error: 'Provide url, event_types, and/or is_active' });
        const w = await apiFetch<unknown>(`/v1/webhooks/${wid}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        return JSON.stringify({ ok: true, webhook: w });
      }
      case 'delete_webhook': {
        const wid = String(args.webhook_id ?? '').trim();
        await apiFetch<{ detail?: string }>(`/v1/webhooks/${wid}`, { method: 'DELETE' });
        return JSON.stringify({ ok: true, detail: 'Webhook deleted' });
      }
      case 'list_webhook_deliveries': {
        const wid = String(args.webhook_id ?? '').trim();
        const rows = await apiFetch<unknown[]>(`/v1/webhooks/${wid}/deliveries`);
        return JSON.stringify({ ok: true, deliveries: rows });
      }
      case 'test_webhook': {
        const wid = String(args.webhook_id ?? '').trim();
        const r = await apiFetch<unknown>(`/v1/webhooks/${wid}/test`, { method: 'POST' });
        return JSON.stringify({ ok: true, result: r });
      }
      case 'create_api_key': {
        const name = String(args.name ?? '').trim();
        const scopes = Array.isArray(args.scopes) ? args.scopes.map(String) : [];
        const created = await apiFetch<unknown>('/v1/api-keys', {
          method: 'POST',
          body: JSON.stringify({ name, scopes }),
        });
        return JSON.stringify({ ok: true, api_key: created });
      }
      case 'revoke_api_key': {
        const kid = String(args.key_id ?? '').trim();
        await apiFetch<{ detail?: string }>(`/v1/api-keys/${kid}`, { method: 'DELETE' });
        return JSON.stringify({ ok: true, detail: 'API key revoked' });
      }
      case 'list_audit_logs': {
        const q = toQuery({
          page: args.page != null ? Number(args.page) : 1,
          page_size: args.page_size != null ? Number(args.page_size) : 25,
          action: typeof args.action === 'string' ? args.action : undefined,
          resource_type: typeof args.resource_type === 'string' ? args.resource_type : undefined,
          resource_id: typeof args.resource_id === 'string' ? args.resource_id : undefined,
          after: typeof args.after === 'string' ? args.after : undefined,
          before: typeof args.before === 'string' ? args.before : undefined,
        });
        const page = await apiFetch<unknown>(`/v1/audit-logs${q}`);
        return JSON.stringify({ ok: true, ...((page as object) || {}) });
      }
      case 'get_dashboard_stats': {
        const s = await apiFetch<unknown>('/v1/dashboard/stats');
        return JSON.stringify({ ok: true, stats: s });
      }
      case 'get_dashboard_timeseries': {
        const days = args.days != null ? Number(args.days) : 30;
        const s = await apiFetch<unknown>(`/v1/dashboard/stats/timeseries${toQuery({ days })}`);
        return JSON.stringify({ ok: true, timeseries: s });
      }
      case 'get_dashboard_funnel': {
        const days = args.days != null ? Number(args.days) : 30;
        const workflow_id = typeof args.workflow_id === 'string' ? args.workflow_id : undefined;
        const s = await apiFetch<unknown>(`/v1/dashboard/stats/funnel${toQuery({ days, workflow_id })}`);
        return JSON.stringify({ ok: true, funnel: s });
      }
      case 'get_dashboard_document_stats': {
        const s = await apiFetch<unknown>('/v1/dashboard/stats/documents');
        return JSON.stringify({ ok: true, document_stats: s });
      }
      case 'get_verification_steps': {
        const sid = String(args.session_id ?? '').trim();
        const steps = await apiFetch<unknown[]>(`/v1/verifications/${sid}/steps`);
        return JSON.stringify({ ok: true, steps });
      }
      case 'submit_verification_review': {
        const sid = String(args.session_id ?? '').trim();
        const decision = String(args.decision ?? '').trim();
        const body: { decision: string; reason?: string } = { decision };
        if (typeof args.reason === 'string' && args.reason.trim()) body.reason = args.reason.trim();
        const r = await apiFetch<unknown>(`/v1/verifications/${sid}/review`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return JSON.stringify({ ok: true, verification: r });
      }
      case 'list_consents': {
        const active_only = Boolean(args.active_only);
        const rows = await apiFetch<unknown[]>(`/v1/consents${toQuery({ active_only })}`);
        return JSON.stringify({ ok: true, consents: rows });
      }
      default:
        return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return JSON.stringify({ ok: false, error: msg });
  }
}
