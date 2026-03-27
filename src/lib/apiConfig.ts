/**
 * Live API integration with `afri-trust-backend`.
 *
 * - **Dev (`npm run dev`)**: uses the live API by default via Vite `server.proxy` (`/v1` → backend).
 *   Opt out with `VITE_USE_MOCK_API=true` or `VITE_API_BASE_URL=mock`.
 * - **Production**: set `VITE_USE_LIVE_API=true` and either `VITE_API_BASE_URL=https://api.example.com`
 *   or host the API on the same origin so relative `/v1` works.
 */
export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
  if (raw === '' || raw === 'mock') return '';
  let base = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  // All client paths include `/v1/...`. If the base URL already ends with `/v1`, drop it to avoid `/v1/v1/...`.
  if (base.toLowerCase().endsWith('/v1')) {
    base = base.slice(0, -3);
    while (base.endsWith('/')) base = base.slice(0, -1);
  }
  return base;
}

export function isLiveApi(): boolean {
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
  if (base === 'mock') return false;
  if (
    import.meta.env.VITE_USE_MOCK_API === 'true' ||
    import.meta.env.VITE_USE_MOCK_API === '1'
  ) {
    return false;
  }
  const explicit =
    import.meta.env.VITE_USE_LIVE_API === 'true' || import.meta.env.VITE_USE_LIVE_API === '1';
  if (explicit || base.length > 0) return true;
  // Local dev: no .env needed — same-origin `/v1` is proxied to the backend (see vite.config.ts).
  if (import.meta.env.DEV) return true;
  return false;
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
