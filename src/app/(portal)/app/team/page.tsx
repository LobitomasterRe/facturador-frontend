import { redirect } from 'next/navigation';
import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import type { TenantMember } from '@/lib/types';
import { TeamClient } from '@/components/team-client';
import { InfoBanner } from '@/components/ui';
export default async function TeamPage(){const actor=await workspaceActor();if(!actor.platformAdmin&&actor.role!=='TENANT_ADMIN')redirect('/app');let members:TenantMember[]=[];let error=false;try{members=await serverApi<TenantMember[]>('tenant/members');}catch{error=true;}
return <div className="page-container"><div className="page-heading"><div><div className="eyebrow">ACCESOS Y PERMISOS</div><h1>Equipo</h1><p>Gestiona las personas autorizadas para operar en esta empresa.</p></div></div>{error&&<InfoBanner variant="warning">No se pudieron consultar los miembros.</InfoBanner>}<TeamClient members={members}/></div>;}
