import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, TENANT_COOKIE } from '@/lib/server-api';
import { sameOrigin } from '@/lib/security';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Origen no autorizado' }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(TENANT_COOKIE);
  return res;
}
