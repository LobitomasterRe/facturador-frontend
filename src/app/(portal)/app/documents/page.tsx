import Link from 'next/link';
import { FilePlus2 } from 'lucide-react';
import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import type { Invoice } from '@/lib/types';
import { DocumentTable } from '@/components/document-table';
import { InfoBanner } from '@/components/ui';
export default async function DocumentsPage() {
  const actor = await workspaceActor();
  let documents: Invoice[] = []; let error = false;
  try { documents = await serverApi<Invoice[]>('documents'); } catch { error = true; }
  return <div className="page-container"><div className="page-heading"><div><div className="eyebrow">GESTIÓN DOCUMENTAL</div><h1>Comprobantes</h1><p>Administra tus facturas, boletas y documentos de prueba.</p></div>{(actor.platformAdmin || actor.role !== 'VIEWER') && <Link href="/app/documents/new" className="btn btn-primary"><FilePlus2 size={18}/> Nuevo comprobante</Link>}</div>
    {error && <InfoBanner variant="warning">No fue posible consultar los comprobantes. Verifica la conexión con la API.</InfoBanner>}
    <DocumentTable documents={documents}/></div>;
}
