'use client';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, UsersRound, Mail } from 'lucide-react';
import { browserApi } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { dateOnly } from '@/lib/format';
import { EmptyState, Field, FormError, LoadingButton, Modal, useToast } from './ui';
export function CustomersClient({ customers, canWrite }: { customers: Customer[]; canWrite: boolean }) {
  const router = useRouter(); const { push } = useToast(); const [query, setQuery] = useState(''); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState<string|null>(null);
  const [type, setType] = useState<'1'|'6'>('6'); const [number, setNumber] = useState(''); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [address, setAddress] = useState('');
  const filtered = useMemo(()=>customers.filter(c => `${c.name} ${c.documentNumber} ${c.email||''}`.toLowerCase().includes(query.toLowerCase())),[customers,query]);
  function reset() { setType('6'); setNumber(''); setName(''); setEmail(''); setAddress(''); setError(null); }
  async function create(e: FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { await browserApi('customers', {method:'POST',body:JSON.stringify({documentType:type,documentNumber:number,name,...(email?{email}:{}),...(address?{address}:{})})}); push('Cliente registrado correctamente.'); setOpen(false); reset(); router.refresh(); }
    catch(e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  return <><div className="table-card">
    <div className="table-toolbar">
      <div className="search-box"><Search size={18}/><input aria-label="Buscar clientes" placeholder="Buscar por nombre, RUC o DNI..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
      <span className="toolbar-count">{filtered.length} clientes</span>
      {canWrite && <NewCustomerButton onClick={()=>setOpen(true)} />}
    </div>
    {filtered.length===0?<EmptyState icon={<UsersRound size={26}/>} title={query?'No encontramos clientes':'Aún no tienes clientes'} description={query?'Intenta con otro nombre o documento.':'Registra un receptor para empezar a preparar comprobantes.'}/>:<div className="table-scroll"><table className="data-table"><thead><tr><th>Nombre o razón social</th><th>Documento</th><th>Contacto</th><th>Fecha de registro</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><span className="person-cell"><span className="person-avatar">{c.name.slice(0,2).toUpperCase()}</span><span className="table-primary">{c.name}</span></span></td><td><span className="table-primary">{c.documentNumber}</span><span className="table-sub">{c.documentType==='6'?'RUC':'DNI'}</span></td><td>{c.email?<span className="subtle-flex"><Mail size={14}/>{c.email}</span>:<span className="muted">Sin correo</span>}</td><td className="table-date">{dateOnly(c.createdAt)}</td></tr>)}</tbody></table></div>}
    <div className="table-footer">Máximo 100 clientes por consulta del backend.</div></div>
    <Modal open={open} onClose={()=>{setOpen(false);reset();}} title="Nuevo cliente" description="Registra al receptor de tus comprobantes."><form className="form-stack" onSubmit={create}><Field label="Tipo de documento" required><select value={type} onChange={e=>{setType(e.target.value as '1'|'6');setNumber('');}}><option value="6">RUC (11 dígitos)</option><option value="1">DNI (8 dígitos)</option></select></Field><Field label="Número de documento" required><input required inputMode="numeric" pattern={type==='6'?'[0-9]{11}':'[0-9]{8}'} maxLength={type==='6'?11:8} placeholder={type==='6'?'20123456789':'12345678'} value={number} onChange={e=>setNumber(e.target.value.replace(/\D/g,''))}/></Field><Field label="Nombre / Razón social" required><input required minLength={2} maxLength={250} placeholder="Nombre completo o razón social" value={name} onChange={e=>setName(e.target.value)}/></Field><Field label="Correo electrónico"><input type="email" placeholder="cliente@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Dirección fiscal"><input maxLength={250} placeholder="Dirección (opcional)" value={address} onChange={e=>setAddress(e.target.value)}/></Field><FormError message={error}/><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setOpen(false)}>Cancelar</button><LoadingButton loading={loading} type="submit">Guardar cliente</LoadingButton></div></form></Modal>
  </>;
}
export function NewCustomerButton({ onClick }: { onClick: ()=>void }) { return <button className="btn btn-primary" onClick={onClick}><Plus size={17}/> Nuevo cliente</button>; }
