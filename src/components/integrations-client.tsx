'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, KeyRound, Copy, Check, Trash2, PlugZap, Terminal, ShieldCheck, AlertTriangle } from 'lucide-react';
import { browserApi } from '@/lib/api';
import { dateOnly } from '@/lib/format';
import type { ApiKey, ApiKeyScope, CreatedApiKey } from '@/lib/types';
import { EmptyState, Field, FormError, InfoBanner, LoadingButton, Modal, useToast } from './ui';
export function IntegrationsClient({ keys }: { keys: ApiKey[] }) {
  const router=useRouter(); const {push}=useToast();const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null);
  const [name,setName]=useState(''),[scope,setScope]=useState<ApiKeyScope>('BILLING'),[revealed,setRevealed]=useState<CreatedApiKey|null>(null),[copied,setCopied]=useState(false);
  async function create(e:FormEvent){e.preventDefault();setLoading(true);setError(null);try{const result=await browserApi<CreatedApiKey>('tenant/api-keys',{method:'POST',body:JSON.stringify({name,scope})});setRevealed(result);setOpen(false);setName('');router.refresh();}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
  async function revoke(id:string){if(!confirm('¿Revocar esta clave? La integración que la utilice dejará de funcionar inmediatamente.'))return;try{await browserApi(`tenant/api-keys/${id}`,{method:'DELETE'});push('Clave revocada.');router.refresh();}catch(e){push((e as Error).message,'error');}}
  async function copyKey(){if(!revealed)return;try{await navigator.clipboard.writeText(revealed.apiKey);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch{push('No se pudo copiar automáticamente','error');}}
  return <><InfoBanner variant="warning">Las claves API deben almacenarse únicamente en el <strong>servidor</strong> de tu software principal. Nunca en Next.js público, localStorage ni código frontend. La clave SSO solo sirve para obtener tickets.</InfoBanner>
    <div className="section-heading"><div><h2>Claves de integración</h2><p>Habilita el intercambio seguro entre sistemas.</p></div><button className="btn btn-primary" onClick={()=>setOpen(true)}><Plus size={17}/> Nueva clave</button></div>
    <div className="table-card">{keys.length===0?<EmptyState icon={<KeyRound size={26}/>} title="Sin claves API" description="Crea una clave BILLING para conectar tu software o una SSO para acceso unificado."/>:<div className="table-scroll"><table className="data-table"><thead><tr><th>Identificador</th><th>Alcance</th><th>Estado</th><th>Último uso</th><th></th></tr></thead><tbody>{keys.map(k=><tr key={k.id}><td><span className="table-primary">{k.name}</span><span className="table-sub monospace">{k.prefix}••••••••</span></td><td><span className="role-pill">{k.scope==='BILLING'?<PlugZap size={15}/>:<ShieldCheck size={15}/>} {k.scope}</span></td><td><span className={`status-tag ${k.active?'status-green':'status-gray'}`}>{k.active?'Activa':'Revocada'}</span></td><td className="table-date">{k.lastUsedAt?dateOnly(k.lastUsedAt):'Nunca'}</td><td>{k.active&&<button className="icon-button danger-hover" aria-label={`Revocar clave ${k.name}`} title="Revocar" onClick={()=>revoke(k.id)}><Trash2 size={17}/></button>}</td></tr>)}</tbody></table></div>}</div>
    <div className="integration-grid"><section className="panel integration-guide"><div className="integration-card-icon"><Terminal size={22}/></div><h2>Conecta tu software</h2><p>Para emitir un borrador desde tu aplicación, realiza la solicitud desde tu backend utilizando una clave BILLING.</p><pre className="code-sample"><code>{`POST /api/v1/documents
x-api-key: fe_<TU_CLAVE>
Content-Type: application/json

{
  "kind": "INVOICE",
  "customerId": "UUID",
  "seriesCode": "F001",
  "lines": [ ... ]
}`}</code></pre><p className="code-caption">La API original corre en NestJS. No se deben enviar claves técnicas desde el navegador.</p></section>
    <section className="panel integration-guide"><div className="integration-card-icon"><ShieldCheck size={22}/></div><h2>Inicio de sesión único</h2><p>Desde tu servidor principal, usa una clave SSO para generar un ticket de un solo uso (60 segundos) para un usuario existente.</p><pre className="code-sample"><code>{`POST /api/v1/auth/sso/ticket
x-api-key: fe_<TU_CLAVE_SSO>

{ "userId": "UUID_USUARIO" }

// Luego enviar ticket mediante
// formulario POST al frontend:
POST /api/session/sso`}</code></pre><p className="code-caption">Nunca pases el ticket en una URL. Para orígenes diferentes configura SSO_ALLOWED_ORIGINS.</p></section></div>
    <Modal open={open} onClose={()=>setOpen(false)} title="Crear clave API" description="Se mostrará el secreto solo una vez."><form className="form-stack" onSubmit={create}><Field label="Nombre de la integración" required><input minLength={3} required value={name} placeholder="Ej. Software principal" onChange={e=>setName(e.target.value)}/></Field><Field label="Alcance" required><select value={scope} onChange={e=>setScope(e.target.value as ApiKeyScope)}><option value="BILLING">BILLING — Comprobantes y clientes</option><option value="SSO">SSO — Tickets de acceso</option></select></Field><FormError message={error}/><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setOpen(false)}>Cancelar</button><LoadingButton loading={loading} type="submit">Crear clave</LoadingButton></div></form></Modal>
    <Modal open={!!revealed} onClose={()=>setRevealed(null)} title="Guarda tu clave ahora" description="Por seguridad, este valor no volverá a mostrarse."><div className="form-stack"><div className="info-banner info-warning"><AlertTriangle size={18}/>Esta clave concede acceso técnico según su alcance. Consérvala en un gestor de secretos.</div><div className="secret-reveal"><code>{revealed?.apiKey}</code><button className="btn btn-outline" onClick={copyKey}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copiada':'Copiar'}</button></div><button className="btn btn-primary btn-block" onClick={()=>setRevealed(null)}>Ya guardé mi clave</button></div></Modal>
  </>;
}
