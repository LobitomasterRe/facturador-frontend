'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Plus, Hash, Info } from 'lucide-react';
import { browserApi } from '@/lib/api';
import { kindName } from '@/lib/format';
import type { DocumentKind, Series } from '@/lib/types';
import { EmptyState, Field, FormError, LoadingButton, Modal, useToast } from './ui';
export function SeriesClient({ series, canAdmin }: { series: Series[]; canAdmin: boolean }) {
  const router=useRouter(), {push}=useToast(); const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null);
  const [kind,setKind]=useState<DocumentKind>('INVOICE'),[code,setCode]=useState('F001'),[nextNumber,setNextNumber]=useState('1');
  async function create(e:FormEvent){e.preventDefault();setLoading(true);setError(null);try{await browserApi('tenant/series',{method:'POST',body:JSON.stringify({kind,code,nextNumber:Number(nextNumber)})});push('Serie registrada correctamente.');setOpen(false);router.refresh();}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
  return <><div className="section-heading"><div><h2>Series configuradas</h2><p>Cada serie pertenece exclusivamente a la empresa seleccionada.</p></div>{canAdmin&&<button className="btn btn-primary" onClick={()=>setOpen(true)}><Plus size={17}/> Nueva serie</button>}</div>
    {series.length===0?<div className="panel"><EmptyState icon={<Layers size={26}/>} title="No hay series configuradas" description="Registra F001 para facturas o B001 para boletas antes de crear documentos." action={canAdmin&&<button className="btn btn-primary" onClick={()=>setOpen(true)}>Agregar serie</button>}/></div>:<div className="series-grid">{series.map(s=><div className="series-card" key={s.id}><div className="series-card-head"><div className="series-icon"><Hash size={22}/></div><span className="status-tag status-blue">{kindName(s.kind)}</span></div><h3>{s.code}</h3><p>Próximo correlativo: <strong>{String(s.nextNumber).padStart(8,'0')}</strong></p><div className="series-card-foot">{s.kind==='INVOICE'?'Serie de facturas':'Serie de boletas'}</div></div>)}</div>}
    <div className="info-banner info-info help-block"><Info size={18}/><div>Las series del backend no admiten edición desde esta versión. El número se asigna cuando un borrador pasa a simulación, nunca desde el frontend.</div></div>
    <Modal open={open} onClose={()=>setOpen(false)} title="Registrar serie" description="La serie será utilizada exclusivamente por este RUC."><form className="form-stack" onSubmit={create}><Field label="Tipo de comprobante" required><select value={kind} onChange={e=>{const next=e.target.value as DocumentKind;setKind(next);setCode(next==='INVOICE'?'F001':'B001');}}><option value="INVOICE">Factura</option><option value="RECEIPT">Boleta</option></select></Field><Field label="Código de serie" required hint="4 caracteres: F o B seguido de tres letras o números."><input required pattern="[FB][A-Z0-9]{3}" maxLength={4} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></Field><Field label="Siguiente correlativo" required><input type="number" required min={1} max={99999999} step={1} value={nextNumber} onChange={e=>setNextNumber(e.target.value)}/></Field><FormError message={error}/><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setOpen(false)}>Cancelar</button><LoadingButton loading={loading} type="submit">Registrar serie</LoadingButton></div></form></Modal>
  </>;
}
