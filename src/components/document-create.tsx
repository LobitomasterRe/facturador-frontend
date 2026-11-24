'use client';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ArrowRight, ArrowLeft, AlertCircle, Info, ReceiptText } from 'lucide-react';
import type { Customer, DocumentKind, Invoice, Series } from '@/lib/types';
import { browserApi } from '@/lib/api';
import { money } from '@/lib/format';
import { Field, FormError, LoadingButton } from './ui';
interface Line { id: number; description: string; quantity: string; unitPrice: string }
export function DocumentCreate({ customers, series }: { customers: Customer[]; series: Series[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<DocumentKind>('INVOICE');
  const [customerId, setCustomerId] = useState(''); const [seriesCode, setSeriesCode] = useState('');
  const [reference, setReference] = useState(''); const [lines, setLines] = useState<Line[]>([{id:1,description:'',quantity:'1',unitPrice:''}]);
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const customerOptions = customers.filter(c => kind === 'RECEIPT' || c.documentType === '6');
  const seriesOptions = series.filter(s => s.kind === kind);
  const totals = useMemo(() => { const subtotal = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0); return { subtotal, tax: subtotal * .18, total: subtotal * 1.18 }; }, [lines]);
  function changeKind(k: DocumentKind) { setKind(k); setSeriesCode(''); setCustomerId(''); }
  function changeLine(id: number, key: keyof Omit<Line, 'id'>, value: string) { setLines(rows => rows.map(l => l.id === id ? {...l,[key]:value} : l)); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (seriesOptions.length === 0) return setError('Registra una serie para este tipo de comprobante.');
    if (!customerId || !seriesCode || lines.some(l => !l.description.trim() || Number(l.quantity) <= 0 || Number(l.unitPrice) < 0 || !l.unitPrice)) return setError('Completa los datos y revisa las cantidades y precios.');
    setLoading(true);
    try {
      const doc = await browserApi<Invoice>('documents', { method:'POST', body: JSON.stringify({ kind, customerId, seriesCode, ...(reference.trim()?{externalReference:reference.trim()}:{}), lines:lines.map(({description,quantity,unitPrice})=>({description:description.trim(),quantity,unitPrice})) }) });
      router.push(`/app/documents/${doc.id}`); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="form-layout">
    <div className="form-main">
      <section className="form-section"><div className="form-section-header"><div className="section-index">01</div><div><h2>Tipo de comprobante</h2><p>Selecciona el documento que deseas preparar.</p></div></div><div className="kind-picker"><button type="button" onClick={()=>changeKind('INVOICE')} className={`kind-option ${kind === 'INVOICE' ? 'chosen' : ''}`}><ReceiptText size={23}/><span><strong>Factura</strong><small>Receptor con RUC</small></span><span className="radio-circle"/></button><button type="button" onClick={()=>changeKind('RECEIPT')} className={`kind-option ${kind === 'RECEIPT' ? 'chosen' : ''}`}><ReceiptText size={23}/><span><strong>Boleta</strong><small>Receptor con DNI o RUC</small></span><span className="radio-circle"/></button></div></section>
      <section className="form-section"><div className="form-section-header"><div className="section-index">02</div><div><h2>Información general</h2><p>Cliente, serie y referencia interna.</p></div></div><div className="form-grid"><Field label="Cliente receptor" required><select required value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Seleccionar cliente</option>{customerOptions.map(c=><option key={c.id} value={c.id}>{c.name} · {c.documentNumber}</option>)}</select>{customerOptions.length===0 && <span className="field-hint warn-text">No hay clientes compatibles con el comprobante.</span>}</Field>
        <Field label="Serie" required><select required value={seriesCode} onChange={e=>setSeriesCode(e.target.value)}><option value="">Seleccionar serie</option>{seriesOptions.map(s=><option key={s.id} value={s.code}>{s.code} · siguiente {String(s.nextNumber).padStart(8,'0')}</option>)}</select>{seriesOptions.length===0 && <span className="field-hint warn-text">No existe una serie de este tipo.</span>}</Field>
        <div className="full-span"><Field label="Referencia externa (opcional)" hint="Identificador único de venta en tu software. Evita duplicar operaciones."><input maxLength={120} placeholder="Ejemplo: VENTA-2026-001" value={reference} onChange={e=>setReference(e.target.value)}/></Field></div></div>
        <div className="inline-callout"><Info size={17}/><span>El correlativo se asignará al solicitar la simulación, después de guardar el borrador.</span></div></section>
      <section className="form-section"><div className="form-section-header"><div className="section-index">03</div><div><h2>Detalle de conceptos</h2><p>Ingresa los servicios o productos. Precios antes del IGV.</p></div></div>
        <div className="lines-table"><div className="line-labels"><span>Descripción</span><span>Cantidad</span><span>Precio base (S/)</span><span></span></div>{lines.map((line,i) => <div key={line.id} className="invoice-line"><input aria-label={`Descripción línea ${i+1}`} placeholder="Descripción del producto o servicio" value={line.description} onChange={e=>changeLine(line.id,'description',e.target.value)} minLength={2} maxLength={500} required/><input type="number" aria-label={`Cantidad línea ${i+1}`} min="0.0001" step="0.0001" value={line.quantity} onChange={e=>changeLine(line.id,'quantity',e.target.value)} required/><input type="number" aria-label={`Precio línea ${i+1}`} min="0" step="0.0001" value={line.unitPrice} onChange={e=>changeLine(line.id,'unitPrice',e.target.value)} placeholder="0.00" required/><button type="button" title="Eliminar línea" aria-label="Eliminar línea" className="icon-button delete-line" disabled={lines.length===1} onClick={()=>setLines(rows=>rows.filter(l=>l.id!==line.id))}><Trash2 size={17}/></button></div>)}</div>
        <button type="button" className="add-line" disabled={lines.length>=100} onClick={()=>setLines(rows=>[...rows,{id:Math.max(0,...rows.map(x=>x.id))+1,description:'',quantity:'1',unitPrice:''}])}><Plus size={17}/> Agregar línea</button>
      </section>
    </div>
    <aside className="form-side"><div className="summary-sticky"><div className="summary-card"><h3>Resumen del documento</h3><p>{kind==='INVOICE'?'Factura electrónica':'Boleta electrónica'} · Vista previa</p><div className="summary-divider"/><div className="totals-row"><span>Subtotal</span><strong>{money(totals.subtotal)}</strong></div><div className="totals-row"><span>IGV estimado (18 %)</span><strong>{money(totals.tax)}</strong></div><div className="summary-divider"/><div className="totals-row total-grand"><span>Total estimado</span><strong>{money(totals.total)}</strong></div><div className="summary-help"><AlertCircle size={16}/> El cálculo final lo realiza el backend. Solo admite operaciones gravadas al 18 % en este MVP.</div></div>
      <FormError message={error}/><LoadingButton loading={loading} type="submit" className="btn btn-primary btn-block">Guardar borrador <ArrowRight size={17}/></LoadingButton><Link href="/app/documents" className="btn btn-ghost btn-block"><ArrowLeft size={16}/> Cancelar</Link>
      <div className="preview-warning">Se generará únicamente un borrador de prueba. No se envía información a SUNAT.</div></div></aside>
  </form>;
}
