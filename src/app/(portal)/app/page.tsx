import Link from 'next/link';
import { ArrowUpRight, FilePlus2, ReceiptText, Clock3, CheckCheck, UsersRound, Wallet, ArrowRight, Layers, Info } from 'lucide-react';
import { workspaceActor } from '@/lib/workspace';
import { serverApi } from '@/lib/server-api';
import { money, dateOnly } from '@/lib/format';
import type { Invoice, Customer, Series } from '@/lib/types';
import { DocumentTable } from '@/components/document-table';
import { InfoBanner } from '@/components/ui';
export default async function Dashboard() {
  const actor = await workspaceActor();
  const [docsResult, customerResult, seriesResult] = await Promise.allSettled([serverApi<Invoice[]>('documents'), serverApi<Customer[]>('customers'), serverApi<Series[]>('tenant/series')]);
  const docs = docsResult.status === 'fulfilled' ? docsResult.value : [];
  const customers = customerResult.status === 'fulfilled' ? customerResult.value : [];
  const series = seriesResult.status === 'fulfilled' ? seriesResult.value : [];
  const hasErrors = [docsResult, customerResult, seriesResult].some(r => r.status === 'rejected');
  const stats = [
    { title: 'Comprobantes recientes', value: docs.length.toString(), sub: 'Hasta 100 documentos', icon: ReceiptText, tone: 'blue' },
    { title: 'Borradores', value: docs.filter(d => d.status === 'DRAFT').length.toString(), sub: 'Pendientes de simular', icon: Clock3, tone: 'amber' },
    { title: 'Simulados', value: docs.filter(d => d.status === 'SIMULATED').length.toString(), sub: 'Sin validez SUNAT', icon: CheckCheck, tone: 'green' },
    { title: 'Clientes registrados', value: customers.length.toString(), sub: 'Hasta 100 receptores', icon: UsersRound, tone: 'violet' },
  ];
  const latest = docs.slice(0, 6);
  const canWrite = actor.platformAdmin || actor.role !== 'VIEWER';
  const totalRecent = docs.reduce((sum, doc) => sum + Number(doc.total ?? 0), 0);
  const lastDays = Array.from({ length: 7 }, (_, i) => { const dt = new Date(); dt.setDate(dt.getDate() - (6 - i)); return dt; });
  const timeline = lastDays.map(date => ({ date, count: docs.filter(d => dateOnly(d.createdAt) === dateOnly(date.toISOString())).length }));
  const max = Math.max(1, ...timeline.map(t => t.count));
  return <div className="page-container">
    <div className="page-heading"><div><div className="eyebrow">CENTRO DE OPERACIONES</div><h1>Panel de control <span className="h1-wave">✳</span></h1><p>Una vista clara de tu actividad de facturación y gestión comercial.</p></div>{canWrite && <Link href="/app/documents/new" className="btn btn-primary"><FilePlus2 size={18}/> Crear comprobante</Link>}</div>
    <div className="test-mode-banner"><span className="test-mode-icon"><Info size={20}/></span><div><strong>Estás trabajando en modo de simulación</strong><span>Los documentos generados son pruebas. No se envían a SUNAT ni tienen validez tributaria.</span></div><span className="test-banner-badge">MVP TÉCNICO</span></div>
    {hasErrors && <InfoBanner variant="warning">No fue posible cargar todos los datos. Comprueba que NestJS y PostgreSQL estén disponibles; algunas cifras podrían mostrarse incompletas.</InfoBanner>}
    <div className="kpi-grid">{stats.map(({ title, value, sub, icon: Icon, tone }) => <div className="kpi-card" key={title}><div className="kpi-top"><span>{title}</span><div className={`kpi-icon tone-${tone}`}><Icon size={20}/></div></div><div className="kpi-value">{value}</div><div className="kpi-sub">{sub}</div></div>)}</div>
    <div className="dashboard-middle">
      <section className="panel growth-panel"><div className="panel-heading"><div><h2>Actividad reciente</h2><p>Documentos creados en los últimos 7 días</p></div><span className="panel-subtle">Vista de hasta 100 registros</span></div><div className="chart-content"><div className="chart-bars">{timeline.map((entry, idx) => <div className="chart-column" key={idx}><div className="bar-area"><div className={`chart-bar ${idx === 6 ? 'bar-current' : ''}`} style={{ height: `${Math.max(4, (entry.count / max) * 100)}%` }} title={`${entry.count} comprobantes`}/></div><span>{new Intl.DateTimeFormat('es-PE',{weekday:'short'}).format(entry.date).replace('.','')}</span></div>)}</div></div><div className="chart-note"><span><span className="chart-legend"/> Comprobantes generados</span><span>{docs.length} en los últimos registros</span></div></section>
      <section className="panel summary-panel"><div className="panel-heading"><div><h2>Resumen operativo</h2><p>Datos de los últimos 100 comprobantes</p></div><div className="summary-icon"><Wallet size={18}/></div></div><div className="summary-amount">{money(totalRecent)}</div><div className="summary-amount-label">Importe acumulado de registros consultados</div><div className="summary-rule"/><div className="summary-row"><span>Series configuradas</span><strong>{series.length}</strong></div><div className="summary-row"><span>Facturas</span><strong>{docs.filter(d => d.kind === 'INVOICE').length}</strong></div><div className="summary-row"><span>Boletas</span><strong>{docs.filter(d => d.kind === 'RECEIPT').length}</strong></div><div className="summary-row"><span>Errores de simulación</span><strong>{docs.filter(d => d.status === 'ERROR').length}</strong></div><Link href="/app/series" className="summary-link">Configurar series <ArrowRight size={16}/></Link></section>
    </div>
    <div className="section-heading"><div><h2>Comprobantes recientes</h2><p>Consulta el detalle y el estado de cada documento.</p></div><Link href="/app/documents" className="link-inline">Ver todos <ArrowUpRight size={16}/></Link></div>
    <DocumentTable documents={latest} compact/>
    {docs.length === 0 && <div className="next-step"><div><Layers size={24}/><strong>¿Primera vez aquí?</strong><p>Configura una serie F001 o B001 y registra un cliente para crear tu primer documento de prueba.</p></div><Link className="btn btn-outline" href="/app/series">Configurar series <ArrowRight size={16}/></Link></div>}
  </div>;
}
