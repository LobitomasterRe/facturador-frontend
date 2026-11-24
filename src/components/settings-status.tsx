'use client';
import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
export function SettingsStatus() {
  const [status,setStatus]=useState<'checking'|'online'|'offline'>('checking');
  async function update(){setStatus('checking');try{const res=await fetch('/api/health',{cache:'no-store'});setStatus(res.ok?'online':'offline');}catch{setStatus('offline');}}
  useEffect(()=>{void update();},[]);
  return <div className="health-check"><div className="health-check-label"><Activity size={18}/><span>Estado del backend NestJS</span></div><div className="health-check-right"><span className={`health-pill health-${status}`}>{status==='online'?'Conectado':status==='offline'?'Desconectado':'Comprobando...'}</span><button className="icon-button" title="Volver a comprobar" aria-label="Comprobar conexión" onClick={update}><RefreshCw size={17}/></button></div></div>;
}
