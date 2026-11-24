import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import type { Customer } from '@/lib/types';
import { CustomersClient } from '@/components/customers-client';
import { InfoBanner } from '@/components/ui';
export default async function CustomersPage(){const actor=await workspaceActor();let list:Customer[]=[];let error=false;try{list=await serverApi<Customer[]>('customers');}catch{error=true;}
  return <div className="page-container"><div className="page-heading"><div><div className="eyebrow">DIRECTORIO</div><h1>Clientes</h1><p>Gestiona los datos de los receptores de comprobantes.</p></div></div>{error&&<InfoBanner variant="warning">No se pudieron cargar los clientes del backend.</InfoBanner>}<CustomersClient customers={list} canWrite={actor.platformAdmin||actor.role!=='VIEWER'}/></div>;}
