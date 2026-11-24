import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, getSession } from '@/lib/server-api';
import { allowedBackendRoute, sameOrigin } from '@/lib/security';
import { errorText } from '@/lib/api';
type Params = { params: Promise<{ path: string[] }> };
const noStore = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };
async function proxy(request: NextRequest, { params }: Params) {
  const method = request.method;
  const { path } = await params;
  if (!allowedBackendRoute(method, path)) return NextResponse.json({ message: 'Ruta no disponible' }, { status: 404 });
  if (method !== 'GET' && !sameOrigin(request)) return NextResponse.json({ message: 'Origen no autorizado' }, { status: 403 });
  const session = await getSession();
  if (!session.token) return NextResponse.json({ message: 'Sesión no iniciada' }, { status: 401 });
  const isDownload = ['xml-preview', 'pdf-preview', 'signed-xml', 'cdr-xml', 'cdr-zip'].includes(path.at(-1) || '');
  try {
    let body: string | undefined;
    if (method === 'POST') {
      if (Number(request.headers.get('content-length') || 0) > 64 * 1024) return NextResponse.json({ message: 'Solicitud demasiado grande' }, { status: 413 });
      if ((request.headers.get('content-type') || '').split(';')[0] !== 'application/json') return NextResponse.json({ message: 'Se requiere application/json' }, { status: 415 });
      body = await request.text();
      if (body.length > 64 * 1024) return NextResponse.json({ message: 'Solicitud demasiado grande' }, { status: 413 });
    }
    const upstream = await backendFetch(path.join('/'), {
      method, body, headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        Accept: isDownload ? '*/*' : 'application/json',
      },
    }, session);
    if (isDownload && upstream.ok) {
      return new NextResponse(upstream.body, { status: 200, headers: {
        ...noStore,
        'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': upstream.headers.get('content-disposition') || 'attachment',
      } });
    }
    const json: unknown = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return NextResponse.json({ message: errorText(json, 'La solicitud no pudo procesarse.') }, { status: upstream.status, headers: noStore });
    return NextResponse.json(json, { status: upstream.status, headers: noStore });
  } catch { return NextResponse.json({ message: 'No se pudo comunicar con el backend.' }, { status: 502, headers: noStore }); }
}
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
