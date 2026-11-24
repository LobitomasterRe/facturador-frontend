import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/server-api';
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(4_000) });
    return NextResponse.json({ frontend: 'ok', backend: res.ok ? 'ok' : 'error' }, { status: res.ok ? 200 : 503 });
  } catch { return NextResponse.json({ frontend: 'ok', backend: 'disconnected' }, { status: 503 }); }
}
