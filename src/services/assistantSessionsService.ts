import { apiFetch } from '../lib/apiClient';

export type AssistantSessionListItem = {
  id: string;
  preview: string;
  updated_at: string;
};

export type AssistantSessionDetail = {
  id: string;
  preview: string;
  state: Record<string, unknown>;
  updated_at: string;
};

export async function listAssistantSessions(limit = 30): Promise<AssistantSessionListItem[]> {
  return apiFetch<AssistantSessionListItem[]>(`/v1/assistant/sessions?limit=${limit}`);
}

export async function createAssistantSession(preview = ''): Promise<AssistantSessionDetail> {
  return apiFetch<AssistantSessionDetail>('/v1/assistant/sessions', {
    method: 'POST',
    body: JSON.stringify({ preview }),
  });
}

export async function getAssistantSession(sessionId: string): Promise<AssistantSessionDetail> {
  return apiFetch<AssistantSessionDetail>(`/v1/assistant/sessions/${sessionId}`);
}

export async function patchAssistantSession(
  sessionId: string,
  body: { preview?: string; state?: Record<string, unknown> }
): Promise<AssistantSessionDetail> {
  return apiFetch<AssistantSessionDetail>(`/v1/assistant/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteAssistantSession(sessionId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/v1/assistant/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}
