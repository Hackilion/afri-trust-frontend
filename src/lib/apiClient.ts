import { apiUrl } from './apiConfig';
import { useSessionStore } from '../store/sessionStore';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseDetail(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d
        .map((x: unknown) =>
          typeof x === 'object' && x !== null && 'msg' in x
            ? String((x as { msg: string }).msg)
            : JSON.stringify(x)
        )
        .join('; ');
    }
    return res.statusText || 'Request failed';
  } catch {
    return res.statusText || 'Request failed';
  }
}

type RequestOpts = RequestInit & { skipAuth?: boolean };

async function refreshAccessToken(): Promise<string | null> {
  const refresh = useSessionStore.getState().refreshToken;
  if (!refresh) return null;
  const res = await fetch(apiUrl('/v1/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string };
  useSessionStore.getState().setAccessToken(data.access_token);
  return data.access_token;
}

/**
 * JSON fetch to the backend. Attaches Bearer token from the session store unless `skipAuth`.
 */
export async function apiFetch<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { skipAuth, headers: hdrs, ...rest } = opts;
  const headers = new Headers(hdrs);
  if (!headers.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const token = useSessionStore.getState().accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const url = apiUrl(path);
  let res = await fetch(url, { ...rest, headers });

  if (res.status === 401 && !skipAuth) {
    const newTok = await refreshAccessToken();
    if (newTok) {
      headers.set('Authorization', `Bearer ${newTok}`);
      res = await fetch(url, { ...rest, headers });
    }
  }

  if (!res.ok) {
    throw new ApiError(await parseDetail(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type');
  if (!ct?.includes('application/json')) return undefined as T;
  return res.json() as Promise<T>;
}
