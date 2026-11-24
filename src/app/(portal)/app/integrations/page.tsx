import { redirect } from 'next/navigation';
import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import type { ApiKey } from '@/lib/types';
import { IntegrationsClient } from '@/components/integrations-client';
import { InfoBanner } from '@/components/ui';
export default async function IntegrationsPage(){const actor=await workspaceActor();if(!actor.platformAdmin&&actor.role!=='TENANT_ADMIN')redirect('/app');let keys:ApiKey[]=[];let error=false;try{keys=await serverApi<ApiKey[]>('tenant/api-keys');}catch{error=true;}
return <div className="page-container"><div className="page-heading"><div><div className="eyebrow">DESARROLLADORES</div><h1>Integraciones API</h1><p>Conecta tu software actual con el servicio de facturación.</p></div></div>{error&&<InfoBanner variant="warning">No se pudieron cargar las claves de integración.</InfoBanner>}<IntegrationsClient keys={keys}/></div>;}
