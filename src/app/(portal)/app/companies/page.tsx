import { redirect } from 'next/navigation';
import { getActor, getSession, serverApi } from '@/lib/server-api';
import type { Tenant } from '@/lib/types';
import { CompaniesClient } from '@/components/companies-client';
import { InfoBanner } from '@/components/ui';
export default async function CompaniesPage(){const actor=await getActor();if(!actor)redirect('/login');if(!actor.platformAdmin)redirect('/app');const {tenantId}=await getSession();let tenants:Tenant[]=[];let error=false;try{tenants=await serverApi<Tenant[]>('system/tenants');}catch{error=true;}
return <div className="page-container"><div className="page-heading"><div><div className="eyebrow">ADMINISTRACIÓN CENTRAL</div><h1>Mis empresas</h1><p>Administra los RUC conectados a tu plataforma de facturación.</p></div></div>{error&&<InfoBanner variant="warning">No se pudieron consultar las empresas registradas.</InfoBanner>}<CompaniesClient tenants={tenants} selectedId={tenantId}/></div>;}
