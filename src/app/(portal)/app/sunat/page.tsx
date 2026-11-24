import { redirect } from 'next/navigation';
import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import { SunatConsole } from '@/components/sunat-console';
import type { SunatOverview } from '@/lib/sunat-types';

export const dynamic = 'force-dynamic';
export default async function SunatPage() {
  const actor = await workspaceActor();
  if (!actor.platformAdmin && actor.role !== 'TENANT_ADMIN') redirect('/app');
  // Si falla la consulta, la consola SIGUE VISIBLE con diagnóstico y botón para reintentar.
  const initial = await serverApi<SunatOverview>('sunat/overview').catch(() => null);
  return <SunatConsole initial={initial} />;
}
