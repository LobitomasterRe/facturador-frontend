import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import type { Customer, Series } from '@/lib/types';
import { DocumentCreate } from '@/components/document-create';
import { InfoBanner } from '@/components/ui';
import { redirect } from 'next/navigation';
export default async function NewDocumentPage() {
  const actor = await workspaceActor();
  if (!actor.platformAdmin && actor.role === 'VIEWER') redirect('/app/documents');
  const [customers,series] = await Promise.all([serverApi<Customer[]>('customers').catch(()=>null),serverApi<Series[]>('tenant/series').catch(()=>null)]);
  return <div className="page-container"><div className="page-crumbs"><Link href="/app/documents">Comprobantes</Link><ChevronRight size={15}/>Nuevo documento</div><div className="page-heading"><div><div className="eyebrow">NUEVA OPERACIÓN</div><h1>Crear comprobante</h1><p>Completa la información para preparar un borrador de prueba.</p></div></div>
    {(!customers || !series) ? <InfoBanner variant="warning">No se pudieron cargar los clientes y series del backend. Comprueba que la API esté disponible.</InfoBanner> : <DocumentCreate customers={customers} series={series}/>}</div>;
}
