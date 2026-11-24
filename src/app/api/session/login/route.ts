import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, SESSION_COOKIE, TENANT_COOKIE, cookieConfig } from '@/lib/server-api';
import { sameOrigin } from '@/lib/security';
import type { LoginResponse } from '@/lib/types';
import { errorText } from '@/lib/api';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Origen no autorizado' }, { status: 403 });
  try {
    if (Number(request.headers.get('content-length') || 0) > 5000) return NextResponse.json({ message: 'Solicitud demasiado grande' }, { status: 413 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ message: 'Solicitud inválida' }, { status: 400 });
    const { email, password, tenantId } = body as Record<string, unknown>;
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 1024) return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 400 });
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({ email, password, ...(typeof tenantId === 'string' && tenantId ? { tenantId } : {}) }),
    });
    const result: unknown = await response.json();
    if (!response.ok) return NextResponse.json({ message: errorText(result, 'No fue posible iniciar sesión.') }, { status: response.status });
    const data = result as LoginResponse;
    if (typeof data.accessToken !== 'string' || !data.user) return NextResponse.json({ message: 'Respuesta de autenticación inválida' }, { status: 502 });
    const reply = NextResponse.json({ user: data.user, memberships: data.memberships, tenantId: data.tenantId });
    reply.cookies.set(SESSION_COOKIE, data.accessToken, cookieConfig());
    reply.cookies.delete(TENANT_COOKIE);
    return reply;
  } catch {
    return NextResponse.json({ message: 'No se pudo contactar con la API de facturación.' }, { status: 502 });
  }
}
