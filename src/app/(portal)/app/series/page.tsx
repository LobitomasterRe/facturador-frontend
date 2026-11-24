import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import type { Series } from '@/lib/types';
import { SeriesClient } from '@/components/series-client';
import { InfoBanner } from '@/components/ui';
export default async function SeriesPage(){const actor=await workspaceActor();let list:Series[]=[];let error=false;try{list=await serverApi<Series[]>('tenant/series');}catch{error=true;}
return <div className="page-container"><div className="page-heading"><div><div className="eyebrow">CONFIGURACIÓN TRIBUTARIA</div><h1>Series y correlativos</h1><p>Define la numeración que usarán los documentos de prueba.</p></div></div>{error&&<InfoBanner variant="warning">No se pudieron consultar las series.</InfoBanner>}<SeriesClient series={list} canAdmin={actor.platformAdmin||actor.role==='TENANT_ADMIN'}/></div>;}
