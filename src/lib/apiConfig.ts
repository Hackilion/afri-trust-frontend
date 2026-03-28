/**
 * Live API integration with `afri-trust-backend`.
 *
 * **Always configure the backend with `VITE_API_BASE_URL`** (Vite exposes only `VITE_*` to the client).
 *
 * - **Empty / unset**: requests use relative `/v1/...` — in dev, Vite proxies `/v1` to the backend (see `vite.config.ts`).
 * - **Set** (e.g. `http://localhost:8000`): browser calls that origin directly (ensure CORS on the API).
 * - **`mock`**: base URL is empty and `isLiveApi()` is false when mock mode is enabled.
 */
export function getApiBaseUrl(): string {
  const raw = String(import.meta.env.VITE_API_BASE_URL ?? 'http://142.93.42.3/').trim();
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
  const base = String(import.meta.env.VITE_API_BASE_URL ?? 'http://142.93.42.3/').trim();
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
  // Dev: empty `VITE_API_BASE_URL` → live API via same-origin `/v1` + Vite proxy.
  if (import.meta.env.DEV) return true;
  return false;
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
