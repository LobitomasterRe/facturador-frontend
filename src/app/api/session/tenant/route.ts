import { NextRequest, NextResponse } from 'next/server';
import { getActor, TENANT_COOKIE, cookieConfig, serverApi } from '@/lib/server-api';
import { sameOrigin, validUuid } from '@/lib/security';
import type { Tenant } from '@/lib/types';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Origen no autorizado' }, { status: 403 });
  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: 'Sesión no válida' }, { status: 401 });
  if (!actor.platformAdmin) return NextResponse.json({ message: 'Solo disponible para el administrador de plataforma' }, { status: 403 });
  try {
    const { tenantId }: { tenantId?: string | null } = await request.json();
    if (tenantId && !validUuid(tenantId)) return NextResponse.json({ message: 'Identificador de empresa inválido' }, { status: 400 });
    if (tenantId) {
      const tenants = await serverApi<Tenant[]>('system/tenants');
      if (!tenants.some(t => t.id === tenantId && t.active)) return NextResponse.json({ message: 'Empresa no habilitada' }, { status: 403 });
    }
    const res = NextResponse.json({ ok: true, tenantId: tenantId || null });
    if (tenantId) res.cookies.set(TENANT_COOKIE, tenantId, cookieConfig()); else res.cookies.delete(TENANT_COOKIE);
    return res;
  } catch {
    return NextResponse.json({ message: 'No se pudo cambiar de empresa' }, { status: 502 });
  }
}
