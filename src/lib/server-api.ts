import 'server-only';
import { cookies } from 'next/headers';
import { ApiError, errorText } from './api';
import type { Actor } from './types';
export const SESSION_COOKIE = 'fe_session';
export const TENANT_COOKIE = 'fe_selected_tenant';
export const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');

export function cookieConfig(maxAge = 8 * 60 * 60) {
  const localHttp = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(process.env.APP_ORIGIN ?? '');
  return { httpOnly: true as const, secure: process.env.NODE_ENV === 'production' && !localHttp, sameSite: 'lax' as const, path: '/', maxAge };
}
export async function getSession() {
  const jar = await cookies();
  return { token: jar.get(SESSION_COOKIE)?.value ?? null, tenantId: jar.get(TENANT_COOKIE)?.value ?? null };
}
export async function backendFetch(path: string, init: RequestInit = {}, session?: { token: string | null; tenantId: string | null }): Promise<Response> {
  const active = session ?? await getSession();
  const headers = new Headers(init.headers);
  if (active.token) headers.set('Authorization', `Bearer ${active.token}`);
  if (active.tenantId) headers.set('x-tenant-id', active.tenantId);
  return fetch(`${BACKEND_URL}/api/v1/${path.replace(/^\//, '')}`, { ...init, headers, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(12_000) });
}
export async function serverApi<T>(path: string, session?: { token: string | null; tenantId: string | null }): Promise<T> {
  const res = await backendFetch(path, {}, session);
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, errorText(body, `Error al consultar ${path} (HTTP ${res.status}).`));
  }
  return res.json() as Promise<T>;
}
export async function getActor(): Promise<Actor | null> {
  const { token, tenantId } = await getSession();
  if (!token) return null;
  try { return await serverApi<Actor>('auth/me', { token, tenantId }); }
  catch {
    // Si se eliminó/deshabilitó la empresa seleccionada, permitir al administrador volver al selector.
    if (tenantId) {
      try { const fallback = await serverApi<Actor>('auth/me', { token, tenantId: null });
        if (fallback.platformAdmin) return fallback;
      } catch { /* sesión realmente inválida */ }
    }
    return null;
  }
}
