/**
 * OpenAI-style tools for the in-browser WebLLM assistant.
 * Handlers use the same JWT session as the rest of the dashboard (apiFetch).
 */
import type { ChatCompletionTool } from '@mlc-ai/web-llm';

import { apiFetch } from '../../lib/apiClient';
import {
  apiAddWorkflowStep,
  apiCreateWorkflow,
  apiGetWorkflow,
  apiListTierProfiles,
  apiListWorkflows,
  apiPublishWorkflow,
} from '../../services/workflowBackendApi';
import { createVerificationSession, listVerifications } from '../../services/verificationService';
import { backendGetVerificationDetail } from '../../services/backendApplicantsService';

/**
 * Hermes-2-Pro is required for reliable WebLLM tool calling: it injects the official
 * function-calling system prompt and JSON grammar. Hermes-3 + custom system + tools can
 * emit plain text and crash JSON parsing inside the engine.
 */
export const ASSISTANT_MODEL_DEFAULT = 'Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC';

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
      description: 'Create a draft workflow.',
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
      description: 'Add a step to a draft workflow.',
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
      description: 'Publish a draft workflow (required before starting verifications).',
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
      description: 'List tier profiles (include_archived for inactive/archived).',
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
      name: 'list_verifications',
      description: 'Paginated verification sessions for the org.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          page_size: { type: 'integer' },
          status: { type: 'string' },
          applicant_id: { type: 'string' },
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
      description: 'Create an applicant record.',
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
      description: 'Start a verification for an applicant with a published workflow_id.',
      parameters: {
        type: 'object',
        properties: {
          applicant_id: { type: 'string' },
          workflow_id: { type: 'string' },
        },
        required: ['applicant_id', 'workflow_id'],
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
];

function safeParseArgs(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw || '{}') as unknown;
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
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
      case 'list_verifications': {
        const page = await listVerifications({
          page: args.page != null ? Number(args.page) : 1,
          page_size: args.page_size != null ? Number(args.page_size) : 25,
          status: typeof args.status === 'string' ? args.status : undefined,
          applicant_id: typeof args.applicant_id === 'string' ? args.applicant_id : undefined,
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
        const session = await createVerificationSession(
          String(args.applicant_id ?? ''),
          String(args.workflow_id ?? '')
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
      default:
        return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return JSON.stringify({ ok: false, error: msg });
  }
}
