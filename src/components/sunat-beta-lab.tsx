'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileCheck2, FlaskConical, LoaderCircle, ShieldAlert } from 'lucide-react';
import { browserApi } from '@/lib/api';
import { useToast } from './ui';

export type BetaInfo = {
  environment: 'SUNAT_BETA_ONLY';
  status: 'NOT_PREPARED' | 'PREPARED' | 'SENDING' | 'ACCEPTED' |
    'ACCEPTED_WITH_OBSERVATIONS' | 'REJECTED' | 'UNCERTAIN';
  description: string | null;
  responseCode: string | null;
  notes: string[];
  sendEnabled: boolean;
  xsdConfigured: boolean;
  notice: string;
};

export function SunatBetaLab({ id, initial, simulated }: { id: string; initial: BetaInfo; simulated: boolean }) {
  const { push } = useToast();
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState<'prepare'|'send'|'download'|null>(null);
  const endpoint = `documents/${id}/beta`;

  async function operation(type: 'prepare'|'send') {
    if (type === 'send' && !window.confirm('¿Enviar este XML firmado al entorno de pruebas SUNAT BETA? NO es un comprobante real. No debe reintentarse automáticamente si la respuesta es incierta.')) return;
    setBusy(type);
    try {
      await browserApi(`${endpoint}/${type}`, { method:'POST', body:'{}' });
      const next = await browserApi<BetaInfo>(`${endpoint}/status`);
      setStatus(next);
      push(type === 'send' ? 'Solicitud enviada a BETA. Revise el CDR.' : 'XML firmado y preparado para pruebas.');
      router.refresh();
    } catch(e) {
      push((e as Error).message, 'error');
      // Si el servidor pudo recibir la solicitud pero falló la respuesta, refrescar estado.
      const next = await browserApi<BetaInfo>(`${endpoint}/status`).catch(() => null);
      if (next) setStatus(next);
    } finally { setBusy(null); }
  }

  async function download(part:'signed-xml'|'cdr-xml'|'cdr-zip') {
    setBusy('download');
    try {
      const res = await fetch(`/api/backend/${endpoint}/${part}`, {cache:'no-store'});
      if (!res.ok) throw new Error('El archivo todavía no está disponible');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href=url;
      link.download=`BETA_${part}_${id.slice(0,8)}.${part === 'cdr-zip' ? 'zip':'xml'}`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch(e) { push((e as Error).message, 'error'); }
    finally { setBusy(null); }
  }

  return <section className="panel detail-panel" style={{marginBottom:24}}>
    <div className="panel-heading"><div><h2><FlaskConical size={20} style={{display:'inline',verticalAlign:'middle',marginRight:8}}/>Laboratorio SUNAT BETA</h2>
      <p>Firma XMLDSig, validación XSD y constancia de prueba. Solo RUC piloto autorizado.</p></div>
    </div>
    <div className="aside-note" style={{marginBottom:14}}><ShieldAlert size={17}/> Resultado BETA sin validez tributaria. La producción está bloqueada.</div>
    <div className="detail-info-grid" style={{marginBottom:16}}>
      <div><span>Estado BETA</span><strong>{status.status.replaceAll('_',' ')}</strong></div>
      <div><span>Validación XSD</span><strong>{status.xsdConfigured?'Configurada':'No configurada'}</strong></div>
      <div><span>Envío BETA</span><strong>{status.sendEnabled?'Habilitado':'Bloqueado por configuración'}</strong></div>
      <div><span>Código CDR</span><strong>{status.responseCode ?? 'Sin respuesta'}</strong></div>
    </div>
    {status.description && <p style={{marginBottom:12}}>{status.description}</p>}
    {status.notes?.length>0 && <p style={{marginBottom:12}}>Observaciones: {status.notes.slice(0,3).join(' · ')}</p>}
    {status.status==='UNCERTAIN' && <p className="form-error">Resultado incierto: no vuelva a enviar el mismo comprobante sin verificar manualmente.</p>}
    <div className="action-group">
      {simulated && status.status==='NOT_PREPARED' && <button className="btn btn-outline" disabled={!!busy} onClick={()=>operation('prepare')}>
        {busy==='prepare'?<LoaderCircle className="spin" size={16}/>:<FileCheck2 size={16}/>} Preparar XML firmado</button>}
      {status.status==='PREPARED' && status.sendEnabled && status.xsdConfigured && <button className="btn btn-primary" disabled={!!busy} onClick={()=>operation('send')}>
        {busy==='send'?<LoaderCircle className="spin" size={16}/>:<FlaskConical size={16}/>} Enviar a SUNAT BETA</button>}
      {status.status!=='NOT_PREPARED' && <button className="btn btn-outline" disabled={!!busy} onClick={()=>download('signed-xml')}><Download size={16}/> XML firmado</button>}
      {['ACCEPTED','ACCEPTED_WITH_OBSERVATIONS','REJECTED','UNCERTAIN'].includes(status.status) && status.responseCode && <>
        <button className="btn btn-outline" disabled={!!busy} onClick={()=>download('cdr-xml')}><Download size={16}/> CDR XML</button>
        <button className="btn btn-outline" disabled={!!busy} onClick={()=>download('cdr-zip')}><Download size={16}/> CDR ZIP</button>
      </>}
    </div>
  </section>;
}
