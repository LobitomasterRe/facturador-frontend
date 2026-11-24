'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, FileText, SlidersHorizontal } from 'lucide-react';
import { dateOnly, documentNumber, kindName, money } from '@/lib/format';
import type { Invoice, DocumentStatus } from '@/lib/types';
import { EmptyState, StatusBadge } from './ui';
export function DocumentTable({ documents, compact = false }: { documents: Invoice[]; compact?: boolean }) {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState<'ALL' | DocumentStatus>('ALL');
  const filtered = useMemo(() => documents.filter(d => (status === 'ALL' || d.status === status) &&
    [d.series, d.number?.toString(), d.externalReference, d.customer?.name, d.customer?.documentNumber].some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))), [documents, status, search]);
  return <div className="table-card">
    {!compact && <div className="table-toolbar"><div className="search-box"><Search size={18}/><input aria-label="Buscar comprobantes" placeholder="Buscar por comprobante, cliente o referencia..." value={search} onChange={e => setSearch(e.target.value)}/></div><div className="select-wrap"><SlidersHorizontal size={16}/><select aria-label="Filtrar por estado" value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="ALL">Todos los estados</option><option value="DRAFT">Borradores</option><option value="QUEUED">En cola</option><option value="PROCESSING">Procesando</option><option value="SIMULATED">Simulados</option><option value="ERROR">Error</option></select></div></div>}
    {filtered.length === 0 ? <EmptyState icon={<FileText size={26}/>} title={search || status !== 'ALL' ? 'Sin coincidencias' : 'Aún no hay comprobantes'} description={search || status !== 'ALL' ? 'Prueba con otro filtro o búsqueda.' : 'Tus documentos aparecerán aquí cuando registres el primero.'} action={!search && !compact && <Link href="/app/documents/new" className="btn btn-primary">Nuevo comprobante</Link>}/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Comprobante</th><th>Cliente</th><th>Fecha</th><th>Importe</th><th>Estado</th><th aria-label="Abrir"/></tr></thead><tbody>{filtered.map(d => <tr key={d.id}><td><Link href={`/app/documents/${d.id}`} className="doc-number">{documentNumber(d)}</Link><span className="table-sub">{kindName(d.kind)}</span></td><td><span className="table-primary">{d.customer?.name ?? 'Cliente'}</span><span className="table-sub">{d.customer?.documentNumber ?? d.externalReference ?? ''}</span></td><td className="table-date">{dateOnly(d.issueDate || d.createdAt)}</td><td className="table-money">{money(d.total)}</td><td><StatusBadge status={d.status}/></td><td><Link href={`/app/documents/${d.id}`} className="table-action" aria-label="Ver comprobante"><ArrowUpRight size={17}/></Link></td></tr>)}</tbody></table></div>}
    {!compact && <div className="table-footer">Mostrando {filtered.length} de {documents.length} comprobantes (máximo 100 del backend). <span>Datos reales del API · Emisión simulada</span></div>}
  </div>;
}
