import type { ChatCompletionMessageParam, ChatCompletionTool } from '@mlc-ai/web-llm';

import { ApiError, apiFetch } from '../../lib/apiClient';

import { AFRI_ASSISTANT_SYSTEM_PROMPT } from './afritrustAssistantTools';

export type AssistantLlmStatusResponse = {
  enabled: boolean;
};

export type ChatCompletionLike = {
  choices: Array<{
    message: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type?: string;
        function: { name: string; arguments?: string };
      }>;
    };
  }>;
};

export async function fetchAssistantLlmStatus(): Promise<AssistantLlmStatusResponse> {
  return apiFetch<AssistantLlmStatusResponse>('/v1/assistant/llm-status');
}

export async function assistantLlmChatCompletion(params: {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  tool_choice?: 'auto' | 'none';
  temperature?: number;
}): Promise<ChatCompletionLike> {
  const body = {
    messages: [
      { role: 'system' as const, content: AFRI_ASSISTANT_SYSTEM_PROMPT },
      ...params.messages,
    ],
    tools: params.tools,
    tool_choice: params.tool_choice ?? 'auto',
    temperature: params.temperature ?? 0.25,
  };
  return apiFetch<ChatCompletionLike>('/v1/assistant/llm-chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function assistantLlmChatCompletionPlain(params: {
  messages: ChatCompletionMessageParam[];
  temperature?: number;
}): Promise<ChatCompletionLike> {
  const body = {
    messages: [
      { role: 'system' as const, content: AFRI_ASSISTANT_SYSTEM_PROMPT },
      ...params.messages,
    ],
    temperature: params.temperature ?? 0.35,
  };
  return apiFetch<ChatCompletionLike>('/v1/assistant/llm-chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** True when we should retry with the on-device model instead of surfacing the error. */
export function assistantLlmErrorShouldFallback(e: unknown): boolean {
  if (!(e instanceof ApiError)) return true;
  if (e.status === 401 || e.status === 403) return false;
  return true;
}
