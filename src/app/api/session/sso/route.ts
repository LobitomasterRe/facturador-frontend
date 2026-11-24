import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, SESSION_COOKIE, TENANT_COOKIE, cookieConfig } from '@/lib/server-api';
import { sameOrigin } from '@/lib/security';
// El sistema externo entrega el ticket en el CUERPO de un POST, jamás en el query string.
export async function POST(request: NextRequest) {
  const extra = (process.env.SSO_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!sameOrigin(request, extra)) return NextResponse.json({ message: 'Origen SSO no autorizado' }, { status: 403 });
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded') && !contentType.includes('application/json')) return NextResponse.json({ message: 'Tipo de solicitud SSO no permitido' }, { status: 415 });
  try {
    if (Number(request.headers.get('content-length') || 0) > 4096) return NextResponse.json({ message: 'Solicitud demasiado grande' }, { status: 413 });
    const token = contentType.includes('application/json') ? (await request.json()).token : (await request.formData()).get('token');
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ message: 'Ticket inválido' }, { status: 400 });
    const upstream = await fetch(`${BACKEND_URL}/api/v1/auth/sso/exchange`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      cache: 'no-store', signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) return NextResponse.json({ message: 'Ticket vencido, utilizado o no autorizado.' }, { status: 401 });
    const result: { accessToken?: string } = await upstream.json();
    if (!result.accessToken) return NextResponse.json({ message: 'No se recibió sesión válida' }, { status: 502 });
    const res = NextResponse.redirect(new URL('/app', process.env.APP_ORIGIN || request.url), { status: 303 });
    res.cookies.set(SESSION_COOKIE, result.accessToken, cookieConfig());
    res.cookies.delete(TENANT_COOKIE);
    return res;
  } catch {
    return NextResponse.json({ message: 'Error al intercambiar el ticket SSO' }, { status: 502 });
  }
}
