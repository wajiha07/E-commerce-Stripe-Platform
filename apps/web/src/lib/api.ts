const API_URL = import.meta.env.VITE_API_URL || '/api';

type RequestOptions = RequestInit & { auth?: boolean };

function getAccessToken() {
  return localStorage.getItem('lunaire_access');
}

export function setTokens(access?: string | null, refresh?: string | null) {
  if (access) localStorage.setItem('lunaire_access', access);
  else localStorage.removeItem('lunaire_access');
  if (refresh) localStorage.setItem('lunaire_refresh', refresh);
  else localStorage.removeItem('lunaire_refresh');
}

export function getRefreshToken() {
  return localStorage.getItem('lunaire_refresh');
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && options.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${getAccessToken()}`);
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new Error(message || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      setTokens(null, null);
      return false;
    }
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    setTokens(null, null);
    return false;
  }
}

export function money(n: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));
}
