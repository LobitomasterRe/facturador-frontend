import Link from 'next/link';
import { ChevronRight, FileText, UserRound, Clock, Info, FileCode2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import { dateTime, documentNumber, kindName, money, quantity } from '@/lib/format';
import type { Invoice } from '@/lib/types';
import { DocumentDetailActions } from '@/components/document-detail-actions';
import { SunatBetaLab } from '@/components/sunat-beta-lab';
import { StatusBadge, InfoBanner } from '@/components/ui';
export default async function DocumentDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await workspaceActor(); const { id } = await params;
  const doc = await serverApi<Invoice>(`documents/${id}`).catch(()=>null);
  if (!doc) notFound();
  const canAdminBeta = !!(actor.platformAdmin || actor.role === 'TENANT_ADMIN');
  const betaStatus = canAdminBeta && doc.kind === 'INVOICE' ? await serverApi<import('@/components/sunat-beta-lab').BetaInfo>(`documents/${id}/beta/status`).catch(() => null) : null;
  return <div className="page-container"><div className="page-crumbs"><Link href="/app/documents">Comprobantes</Link><ChevronRight size={15}/>{documentNumber(doc)}</div>
    <div className="page-heading detail-heading"><div><div className="eyebrow">DETALLE DEL DOCUMENTO</div><h1>{documentNumber(doc)}</h1><p>{kindName(doc.kind)} · Creado el {dateTime(doc.createdAt)}</p></div><StatusBadge status={doc.status}/></div>
    <InfoBanner variant="warning"><strong>Comprobante de prueba.</strong> No ha sido emitido ni aceptado en producción. Las pruebas SUNAT BETA y las vistas previas carecen de validez tributaria.</InfoBanner>
    <DocumentDetailActions id={id} status={doc.status} canWrite={actor.platformAdmin || actor.role!=='VIEWER'}/>
    {canAdminBeta && doc.kind === 'INVOICE' && (betaStatus
      ? <SunatBetaLab id={id} initial={betaStatus} simulated={doc.status === 'SIMULATED'}/>
      : <section className="panel detail-panel" style={{marginBottom:24}}><div className="panel-heading"><div><h2>Laboratorio SUNAT BETA</h2><p>Este módulo no se oculta aunque falle la configuración.</p></div></div><InfoBanner variant="warning">No se pudo consultar el estado BETA para esta factura. Verifica el RUC piloto, permisos, backend y certificado desde el <Link href="/app/sunat" style={{fontWeight:750,textDecoration:'underline'}}>Centro de control SUNAT</Link>. El envío permanece bloqueado.</InfoBanner></section>)}
    <div className="detail-grid"><div className="detail-main">
      <section className="panel detail-panel"><div className="panel-heading"><div><h2>Información del comprobante</h2><p>Datos generales de la operación</p></div><FileText size={20} className="muted-icon"/></div><div className="detail-info-grid"><div><span>Tipo de documento</span><strong>{kindName(doc.kind)}</strong></div><div><span>Serie y número</span><strong>{documentNumber(doc)}</strong></div><div><span>Fecha de emisión</span><strong>{dateTime(doc.issueDate)}</strong></div><div><span>Referencia externa</span><strong>{doc.externalReference || 'Sin referencia'}</strong></div></div></section>
      <section className="panel detail-panel"><div className="panel-heading"><div><h2>Detalle de conceptos</h2><p>Desglose calculado por el backend</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Descripción</th><th>Cant.</th><th>Precio base</th><th>Total</th></tr></thead><tbody>{doc.lines?.map(l=><tr key={l.id}><td className="table-primary">{l.description}</td><td>{quantity(l.quantity)}</td><td>{money(l.unitPrice)}</td><td className="table-money">{money(l.total)}</td></tr>)}</tbody></table></div><div className="detail-totals"><div><span>Subtotal</span><strong>{money(doc.subtotal)}</strong></div><div><span>IGV (18%)</span><strong>{money(doc.taxAmount)}</strong></div><div className="detail-grand"><span>Total</span><strong>{money(doc.total)}</strong></div></div></section>
      <section className="panel detail-panel"><div className="panel-heading"><div><h2>Historial de intentos</h2><p>Registro de procesamiento de prueba</p></div><Clock size={19} className="muted-icon"/></div>{doc.attempts?.length ? <div className="attempt-list">{doc.attempts.map(a=><div className="attempt" key={a.id}><div className="attempt-dot"/><div><strong>{a.result}</strong><span>{a.mode} · {dateTime(a.createdAt)}</span>{a.details && <p>{a.details}</p>}</div></div>)}</div> : <p className="panel-empty-copy">Todavía no existen intentos de procesamiento.</p>}{doc.lastError && <div className="form-error">{doc.lastError}</div>}</section>
    </div><aside className="detail-aside"><section className="panel aside-panel"><div className="panel-heading"><div><h2>Cliente receptor</h2><p>Datos asociados</p></div><UserRound size={19} className="muted-icon"/></div><div className="detail-customer-avatar">{doc.customer?.name?.slice(0,2).toUpperCase() || 'CL'}</div><strong className="customer-name-lg">{doc.customer?.name || 'No disponible'}</strong><span className="detail-muted">{doc.customer?.documentNumber || ''}</span></section>
      <section className="panel aside-panel"><div className="panel-heading"><div><h2>Estado técnico</h2></div><FileCode2 size={19} className="muted-icon"/></div><div className="detail-kv"><span>Identificador</span><code>{doc.id.slice(0,12)}…</code></div><div className="detail-kv"><span>Estado</span><StatusBadge status={doc.status}/></div><div className="detail-kv"><span>Última actualización</span><strong>{dateTime(doc.updatedAt)}</strong></div><div className="detail-kv"><span>Validez SUNAT</span><strong className="danger-text">No válido</strong></div><div className="aside-note"><Info size={15}/> La simulación nunca representa aceptación tributaria.</div></section>
    </aside></div></div>;
}
