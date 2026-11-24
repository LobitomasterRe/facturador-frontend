'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, RotateCcw, Download, FileCode2, LoaderCircle, RefreshCw } from 'lucide-react';
import type { DocumentStatus } from '@/lib/types';
import { browserApi } from '@/lib/api';
import { useToast } from './ui';
export function DocumentDetailActions({ id, status, canWrite }: { id: string; status: DocumentStatus; canWrite: boolean }) {
  const router = useRouter(); const { push } = useToast(); const [busy, setBusy] = useState(false); const [downloadBusy, setDownloadBusy] = useState<string|null>(null);
  useEffect(() => {
    if (status !== 'QUEUED' && status !== 'PROCESSING') return;
    const interval = window.setInterval(() => router.refresh(), 5_000);
    return () => window.clearInterval(interval);
  }, [status, router]);
  async function action(kind: 'submit' | 'retry') {
    if (!window.confirm(kind === 'submit' ? '¿Solicitar simulación de emisión? Se asignará un correlativo definitivo dentro del entorno de prueba.' : '¿Reintentar la simulación?')) return;
    setBusy(true);
    try { await browserApi(`documents/${id}/${kind}`, {method:'POST',body:'{}'}); push(kind==='submit'?'Documento enviado a simulación.':'Reintento solicitado.'); router.refresh(); }
    catch(e) { push((e as Error).message,'error'); } finally { setBusy(false); }
  }
  async function download(format: 'xml' | 'pdf') {
    setDownloadBusy(format);
    try {
      const res = await fetch(`/api/backend/documents/${id}/${format}-preview`, { cache:'no-store' });
      if (!res.ok) { const parsed = await res.json(); throw new Error(parsed.message || 'No se pudo descargar el archivo'); }
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=`VISTA-PREVIA-NO-VALIDA-${id.slice(0,8)}.${format}`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch(e) { push((e as Error).message,'error'); } finally { setDownloadBusy(null); }
  }
  return <div className="action-group"><button type="button" className="btn btn-outline" onClick={()=>router.refresh()}><RefreshCw size={17}/> Actualizar estado</button>
    {canWrite && status==='DRAFT' && <button disabled={busy} onClick={()=>action('submit')} className="btn btn-primary">{busy?<LoaderCircle className="spin" size={17}/>:<Play size={17}/>} Simular emisión</button>}
    {canWrite && status==='ERROR' && <button disabled={busy} onClick={()=>action('retry')} className="btn btn-primary">{busy?<LoaderCircle className="spin" size={17}/>:<RotateCcw size={17}/>} Reintentar</button>}
    {status!=='DRAFT' && <button disabled={!!downloadBusy} className="btn btn-outline" onClick={()=>download('xml')}>{downloadBusy==='xml'?<LoaderCircle className="spin" size={17}/>:<FileCode2 size={17}/>} XML de prueba</button>}
    <button disabled={!!downloadBusy} className="btn btn-outline" onClick={()=>download('pdf')}>{downloadBusy==='pdf'?<LoaderCircle className="spin" size={17}/>:<Download size={17}/>} PDF de prueba</button>
  </div>;
}
