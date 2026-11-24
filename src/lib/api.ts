import type { ApiErrorResponse } from './types';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = 'ApiError'; }
}
export function errorText(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const parsed = body as ApiErrorResponse;
  if (Array.isArray(parsed.message)) return parsed.message.join('. ');
  return typeof parsed.message === 'string' ? parsed.message : fallback;
}
export async function readResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* non-JSON error */ }
    throw new ApiError(res.status, errorText(body, `No se pudo completar la operación (HTTP ${res.status}).`));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export async function browserApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/backend/${path.replace(/^\//, '')}`, {
    ...options, credentials: 'same-origin', cache: 'no-store',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  return readResponse<T>(res);
}
export function csvEscape(text: string) { return `"${text.replaceAll('"', '""')}"`; }
