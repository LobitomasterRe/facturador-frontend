import 'server-only';
import { redirect } from 'next/navigation';
import { getActor } from './server-api';
export async function workspaceActor() {
  const actor = await getActor();
  if (!actor) redirect('/login');
  if (!actor.tenantId) redirect('/app/companies');
  return actor;
}
