import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getActor, getSession, serverApi } from '@/lib/server-api';
import type { Tenant } from '@/lib/types';
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const { tenantId } = await getSession();
  const tenants = actor.platformAdmin ? await serverApi<Tenant[]>('system/tenants').catch(() => []) : [];
  const selectedTenant = actor.platformAdmin
    ? tenants.find(t => t.id === tenantId) ?? null
    : await serverApi<Tenant>('tenant/me').catch(() => null);
  return <AppShell actor={actor} tenants={tenants} selectedTenant={selectedTenant}>{children}</AppShell>;
}
