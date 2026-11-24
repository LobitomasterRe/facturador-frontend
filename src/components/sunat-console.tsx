'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Activity, AlertCircle, AlertTriangle, ArrowRight, BookOpen, Check, CheckCircle2,
  ChevronRight, Cloud, Copy, ExternalLink,
  FileClock, FileCode2, FileText, Fingerprint, KeyRound,
  LoaderCircle, LockKeyhole, RadioTower, RefreshCw, Server,
  ShieldAlert, ShieldCheck, ShieldOff, Terminal, Wifi, WifiOff, XCircle,
} from 'lucide-react';
import { browserApi } from '@/lib/api';
import type { SunatOverview, SunatProbe, SunatCheckState } from '@/lib/sunat-types';
import { useToast } from './ui';

type Tab = 'overview' | 'configuration' | 'history' | 'errors';
const TAB_NAMES: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Resumen y diagnóstico' },
  { id: 'configuration', label: 'Certificado y credenciales' },
  { id: 'history', label: 'Historial de envíos' },
  { id: 'errors', label: 'Errores y validaciones' },
];
const stateLabels: Record<string, string> = {
  PREPARED: 'XML preparado', SENDING: 'En proceso', ACCEPTED: 'Aceptado BETA',
  ACCEPTED_WITH_OBSERVATIONS: 'Aceptado con observaciones BETA',
  REJECTED: 'Rechazado BETA', UNCERTAIN: 'Resultado incierto',
  SIMULATED: 'Simulación local', ERROR: 'Error local', QUEUED: 'En cola',
  PROCESSING: 'Procesando',
};
const getStateLabel = (code: string) => stateLabels[code] || code.replaceAll('_', ' ');
const stateTone = (state: string) => state === 'ACCEPTED' ? 'ok' :
  ['REJECTED','UNCERTAIN','ERROR'].includes(state) ? 'error' : 'warning';
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('es-PE', {
  dateStyle:'medium', timeStyle:'short' }) : 'Sin registro';
function StatusPill({ state, children }: { state: SunatCheckState; children: React.ReactNode }) {
  return <span className={`sunat-pill sunat-pill-${state}`}><span className="sunat-pill-dot"/>{children}</span>;
}
function DocId({ doc }: { doc: { id: string; series: string; number: number | null; kind: string } }) {
  const number = doc.number === null ? 'Sin numerar' : `${doc.series}-${String(doc.number).padStart(8,'0')}`;
  return <Link href={`/app/documents/${doc.id}`} className="sunat-doc-link">{number}<ChevronRight size={13}/></Link>;
}
function CardHeading({ icon: Icon, title, subtitle, aside }: {
  icon: typeof Activity; title: string; subtitle?: string; aside?: React.ReactNode }) {
  return <div className="sunat-section-heading"><div className="sunat-section-title"><span className="sunat-heading-icon"><Icon size={18}/></span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{aside}</div>;
}
function SimpleEmpty({ title, detail }: { title: string; detail: string }) {
  return <div className="sunat-empty"><FileClock size={25}/><strong>{title}</strong><p>{detail}</p></div>;
}

export function SunatConsole({ initial }: { initial: SunatOverview | null }) {
  const { push } = useToast();
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState<'refresh'|'probe'|null>(null);
  const [probe, setProbe] = useState<SunatProbe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const blocked = !data?.configuration.pilotAuthorized || !data?.configuration.certificate.valid ||
    !data?.configuration.certificate.keyMatches || !data?.configuration.xsdConfigured ||
    !data?.configuration.sendEnabled || !data?.company.active;
  const counts: Record<string, number> = data?.metrics.byStatus ?? {};
  const errorRows = useMemo(() => data?.betaDocuments.filter(item =>
    ['REJECTED','UNCERTAIN','ACCEPTED_WITH_OBSERVATIONS'].includes(item.status) ||
    Boolean(item.responseNotes?.length)) || [], [data]);
  const localErrors = data?.attempts.filter(a => ['ERROR','FAILED'].includes(a.result) ||
    (a.mode !== 'BETA' && a.result === 'UNCERTAIN')) || [];

  async function refresh() {
    setBusy('refresh'); setError(null);
    try {
      const updated = await browserApi<SunatOverview>('sunat/overview');
      setData(updated);
      push('Información de SUNAT actualizada.');
    } catch(e) {
      setError((e as Error).message);
      push('No se pudo consultar la consola del backend.', 'error');
    } finally { setBusy(null); }
  }
  async function testConnection() {
    setBusy('probe'); setError(null); setProbe(null);
    try {
      const result = await browserApi<SunatProbe>('sunat/diagnostics', { method: 'POST', body: '{}' });
      setProbe(result);
      if (result.result === 'reachable') push('SUNAT BETA respondió al diagnóstico HTTP.');
      else push(result.detail, 'error');
    } catch(e) {
      setError((e as Error).message);
      push('El backend no pudo ejecutar el diagnóstico.', 'error');
    } finally { setBusy(null); }
  }
  async function copyText(value: string) {
    try { await navigator.clipboard.writeText(value); push('Copiado al portapapeles.'); }
    catch { push('No se pudo copiar.', 'error'); }
  }
  function renderOverview() {
    return <div className="sunat-main-columns">
      <div className="sunat-stack">
        <section className="panel sunat-panel">
          <CardHeading icon={Activity} title="Estado de la integración" subtitle="Controles de preparación del backend para el RUC activo" aside={<StatusPill state={blocked?'warning':'ok'}>{blocked?'Configuración incompleta':'Configuración lista'}</StatusPill>}/>
          <div className="sunat-check-grid">
            {data!.checks.map(check => <div className="sunat-check" key={check.id}>
              <span className={`sunat-check-icon sunat-check-${check.state}`}>{check.state==='ok'?<Check size={16}/>:check.state==='error'?<XCircle size={16}/>:<AlertTriangle size={16}/>}</span>
              <div><strong>{check.title}</strong><p>{check.detail}</p></div>
            </div>)}
          </div>
          <div className="sunat-internal-note"><ShieldAlert size={17}/><span>Todos los controles se realizan contra el backend. Que el certificado sea legible no significa que SUNAT lo haya registrado o aceptado.</span></div>
        </section>
        <section className="panel sunat-panel">
          <CardHeading icon={Wifi} title="Diagnóstico de conectividad" subtitle="Prueba de red desde NestJS hasta el WSDL oficial BETA"/>
          <div className="sunat-connectivity-layout"><div className="sunat-connectivity-chain">
            <div className="sunat-connectivity-node"><Server size={21}/><strong>NestJS</strong><span>Servidor API</span></div>
            <div className={`sunat-connectivity-line ${probe?.result==='reachable'?'sunat-line-success':''}`}><span/><span/><span/></div>
            <div className="sunat-connectivity-node"><Cloud size={21}/><strong>SUNAT BETA</strong><span>Servicio WSDL</span></div>
          </div><div className="sunat-connectivity-result">
            <StatusPill state={!probe?'warning':probe.result==='reachable'?'ok':'error'}>
              {!probe?'Sin verificar':probe.result==='reachable'?'WSDL accesible':probe.result==='unreachable'?'Sin conexión':'Respuesta inesperada'}
            </StatusPill>
            {probe ? <><strong>{probe.detail}</strong><span>HTTP {probe.httpStatus ?? '—'} · {probe.latencyMs} ms · {formatDate(probe.checkedAt)}</span></> :
              <><strong>No se ha ejecutado el diagnóstico de red.</strong><span>No se realizan solicitudes externas automáticamente al abrir esta pantalla.</span></>}
            <button className="btn btn-primary" disabled={!!busy} onClick={testConnection}>
              {busy==='probe'?<LoaderCircle className="spin" size={16}/>:<RadioTower size={16}/>}
              {busy==='probe'?'Verificando...':'Probar conexión BETA'}
            </button>
          </div></div>
          <div className="sunat-guardrail"><LockKeyhole size={15}/><span>Esta acción solo consulta el WSDL. No envía XML, no utiliza claves SOL ni demuestra aceptación de comprobantes.</span></div>
        </section>
        <section className="panel sunat-panel">
          <CardHeading icon={FileText} title="Últimos comprobantes BETA" subtitle="Resultado observado, no emisión tributaria" aside={<button className="sunat-text-button" onClick={()=>setTab('history')}>Ver historial <ArrowRight size={14}/></button>}/>
          {data!.betaDocuments.length ? <div className="sunat-table-wrap"><table className="sunat-table"><thead><tr><th>Comprobante</th><th>Estado BETA</th><th>Código</th><th>Actualización</th></tr></thead><tbody>{data!.betaDocuments.slice(0,7).map(b=><tr key={b.document.id}><td><DocId doc={b.document}/></td><td><StatusPill state={stateTone(b.status)}>{getStateLabel(b.status)}</StatusPill></td><td>{b.responseCode ?? '—'}</td><td>{formatDate(b.updatedAt)}</td></tr>)}</tbody></table></div> : <SimpleEmpty title="Todavía no hay XML firmados" detail="Simula una factura, abre su detalle y utiliza el Laboratorio SUNAT BETA para preparar un documento."/>}
        </section>
      </div>
      <aside className="sunat-stack">
        <section className="panel sunat-panel sunat-side-panel">
          <CardHeading icon={ShieldCheck} title="Preparación de pruebas" subtitle="Lo que falta para iniciar el piloto"/>
          <div className="sunat-progress"><div><strong>{data!.checks.filter(x=>x.state==='ok').length} de {data!.checks.length}</strong><span>controles satisfactorios</span></div><div className="sunat-progress-track"><span style={{width:`${100 * data!.checks.filter(x=>x.state==='ok').length / data!.checks.length}%`}}/></div></div>
          <div className="sunat-step-list">{data!.checks.filter(x=>x.state!=='ok').map(check=><div key={check.id} className="sunat-step"><AlertCircle size={17}/><span>{check.title}</span></div>)}{data!.checks.every(x=>x.state==='ok') && <div className="sunat-step sunat-step-ok"><CheckCircle2 size={17}/>Configuración técnica preliminar completa</div>}</div>
          <button className="btn btn-outline sunat-full-button" onClick={()=>setTab('configuration')}>Revisar configuración <ArrowRight size={16}/></button>
        </section>
        <section className="panel sunat-panel sunat-side-panel"><CardHeading icon={FileCode2} title="Estados BETA" subtitle="Distribución de documentos preparados"/>
          {data!.metrics.betaTotal ? <div className="sunat-state-list">{Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([code,count])=><div key={code} className="sunat-state-item"><div><span>{getStateLabel(code)}</span><strong>{count}</strong></div><div className="sunat-progress-track"><span className={`sunat-bar-${stateTone(code)}`} style={{width:`${100*count/data!.metrics.betaTotal}%`}}/></div></div>)}</div> : <p className="sunat-muted">No hay documentos BETA todavía.</p>}
        </section>
        <section className="panel sunat-panel sunat-side-panel"><CardHeading icon={BookOpen} title="Alcance actual"/><p className="sunat-muted">El motor piloto admite factura 01, PEN, IGV 18 %, operación gravada simple y pago al contado.</p><a className="sunat-link" href="https://cpe.sunat.gob.pe/guias-y-manuales" target="_blank" rel="noopener noreferrer">Especificaciones técnicas SUNAT <ExternalLink size={14}/></a></section>
      </aside>
    </div>;
  }
  function renderConfiguration() {
    const c = data!.configuration;
    return <div className="sunat-main-columns">
      <div className="sunat-stack">
        <section className="panel sunat-panel"><CardHeading icon={Fingerprint} title="Certificado digital" subtitle="Metadatos públicos del certificado instalado en NestJS" aside={<StatusPill state={c.certificate.valid && c.certificate.keyMatches?'ok':'warning'}>{c.certificate.valid&&c.certificate.keyMatches?'Vigente y coincidente':'Requiere revisión'}</StatusPill>}/>
          <div className="sunat-settings-grid">
            <div><span>Archivo y clave legibles</span><strong>{c.certificate.readable?'Sí':'No'}</strong></div>
            <div><span>Correspondencia clave / certificado</span><strong>{c.certificate.keyMatches?'Verificada':'Pendiente'}</strong></div>
            <div><span>Inicio de vigencia</span><strong>{formatDate(c.certificate.validFrom)}</strong></div>
            <div><span>Fin de vigencia</span><strong>{formatDate(c.certificate.validTo)}</strong></div>
            <div><span>Titular</span><strong className="sunat-wrap-long">{c.certificate.subject || 'No disponible'}</strong></div>
            <div><span>Emisor</span><strong className="sunat-wrap-long">{c.certificate.issuer || 'No disponible'}</strong></div>
          </div>
          {c.certificate.fingerprint256 && <div className="sunat-fingerprint"><span>Huella SHA-256 del certificado público</span><code>{c.certificate.fingerprint256}</code><button type="button" className="icon-button" aria-label="Copiar huella" onClick={()=>copyText(c.certificate.fingerprint256!)}><Copy size={16}/></button></div>}
          <div className="sunat-internal-note"><ShieldCheck size={17}/><span>{c.certificate.detail}</span></div>
        </section>
        <section className="panel sunat-panel"><CardHeading icon={KeyRound} title="Credenciales de conexión" subtitle="Configuración segura y restringida al entorno de laboratorio"/>
          <div className="sunat-settings-grid">
            <div><span>Entorno</span><strong>SUNAT BETA</strong></div>
            <div><span>Autenticación BETA</span><strong>MODDATOS (usuario técnico de pruebas)</strong></div>
            <div><span>RUC autorizado</span><strong>{c.pilotAuthorized?'Coincide con el seleccionado':'Falta configurar o no coincide'}</strong></div>
            <div><span>Producción</span><strong>Bloqueada por diseño</strong></div>
            <div><span>XSD oficial en servidor</span><strong>{c.xsdConfigured?'Archivo detectado':'No detectado'}</strong></div>
            <div><span>Envío BETA</span><strong>{c.sendEnabled?'Habilitado expresamente':'Bloqueado (recomendado inicialmente)'}</strong></div>
          </div>
          <p className="sunat-muted" style={{marginTop:16}}>{c.authentication.note}</p>
          <div className="sunat-guardrail"><LockKeyhole size={16}/><span>No existe formulario para subir certificados, contraseñas o claves SOL al navegador. Estas credenciales se administran exclusivamente en el servidor o gestor de secretos.</span></div>
        </section>
        <section className="panel sunat-panel"><CardHeading icon={Terminal} title="Cómo completar la configuración" subtitle="Variables de entorno del servicio API, nunca NEXT_PUBLIC_*"/>
          <div className="sunat-code-header"><span>Backend · .env</span><button onClick={()=>copyText('SUNAT_ENV=BETA\nSUNAT_BETA_ALLOWED_RUC=RUC_PILOTO_11_DIGITOS\nSUNAT_BETA_SEND_ENABLED=false\nSUNAT_BETA_KEY_PATH=/run/secrets/sunat/beta.key\nSUNAT_BETA_CERT_PATH=/run/secrets/sunat/beta.crt\nSUNAT_BETA_XSD_ENTRYPOINT=/app/schemas/UBL-Invoice-2.1.xsd')} className="sunat-text-button"><Copy size={14}/> Copiar</button></div>
          <pre className="sunat-code"><code>{`SUNAT_ENV=BETA\nSUNAT_BETA_ALLOWED_RUC=RUC_PILOTO_11_DIGITOS\nSUNAT_BETA_SEND_ENABLED=false\nSUNAT_BETA_KEY_PATH=/run/secrets/sunat/beta.key\nSUNAT_BETA_CERT_PATH=/run/secrets/sunat/beta.crt\nSUNAT_BETA_XSD_ENTRYPOINT=/app/schemas/UBL-Invoice-2.1.xsd`}</code></pre>
          <div className="sunat-configuration-steps"><p><strong>1.</strong> Configura el RUC piloto y coloca certificado/clave PEM en el directorio privado montado en Docker.</p><p><strong>2.</strong> Instala el árbol XSD oficial completo con sus importaciones relativas y ajusta la ruta real.</p><p><strong>3.</strong> Reinicia el backend y actualiza este panel. Verifica el XML firmado antes de activar el envío.</p><p><strong>4.</strong> Solo tras pruebas y autorización, modifica <code>SUNAT_BETA_SEND_ENABLED=true</code> para enviar a BETA.</p></div>
        </section>
      </div>
      <aside className="sunat-stack">
        <section className="panel sunat-panel sunat-side-panel"><CardHeading icon={Server} title="Servidor autorizado"/><div className="sunat-configuration-kv"><span>RUC actual</span><strong>{data!.company.ruc}</strong></div><div className="sunat-configuration-kv"><span>Razón social</span><strong>{data!.company.legalName}</strong></div><div className="sunat-configuration-kv"><span>Credenciales</span><strong>Solo backend</strong></div><div className="sunat-configuration-kv"><span>Estado general</span><StatusPill state={blocked?'warning':'ok'}>{blocked?'Por configurar':'Preparado'}</StatusPill></div></section>
        <section className="panel sunat-panel sunat-side-panel"><CardHeading icon={ShieldOff} title="Seguridad tributaria"/><p className="sunat-muted">La verificación criptográfica local no prueba que el certificado esté registrado ante SUNAT ni que el RUC esté habilitado como emisor. Tampoco acredita el cumplimiento regulatorio para brindar servicios a terceros.</p></section>
      </aside>
    </div>;
  }
  function renderHistory() {
    const attempts = data!.attempts.filter(a => filter==='all' || (filter==='beta' ? a.mode==='BETA' : a.mode!=='BETA'));
    return <section className="panel sunat-panel"><CardHeading icon={FileClock} title="Historial de procesamiento" subtitle="Últimos 50 intentos registrados para esta empresa" aside={<select className="sunat-select" value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filtrar historial"><option value="all">Todos los procesos</option><option value="beta">SUNAT BETA</option><option value="local">Simulación local</option></select>}/>
      {attempts.length ? <div className="sunat-table-wrap"><table className="sunat-table"><thead><tr><th>Documento</th><th>Origen</th><th>Resultado</th><th>Fecha</th><th>Detalle</th></tr></thead><tbody>{attempts.map(a=><tr key={a.id}><td><DocId doc={a.document}/></td><td>{a.mode==='BETA'?'SUNAT BETA':a.mode}</td><td><StatusPill state={stateTone(a.result)}>{getStateLabel(a.result)}</StatusPill></td><td>{formatDate(a.createdAt)}</td><td className="sunat-detail-cell">{a.details || '—'}</td></tr>)}</tbody></table></div> : <SimpleEmpty title="Sin intentos registrados" detail="Cuando se procese un comprobante, el registro de intentos aparecerá aquí."/>}</section>;
  }
  function renderErrors() {
    return <div className="sunat-stack"><section className="panel sunat-panel"><CardHeading icon={AlertTriangle} title="Rechazos, observaciones e incertidumbres" subtitle="Solo resultados registrados para la empresa seleccionada" aside={<StatusPill state={errorRows.length?'warning':'ok'}>{errorRows.length} registros</StatusPill>}/>
      {errorRows.length ? <div className="sunat-error-list">{errorRows.map(b=><div className="sunat-error-item" key={b.document.id}>
        <div className="sunat-error-head"><DocId doc={b.document}/><StatusPill state={stateTone(b.status)}>{getStateLabel(b.status)}</StatusPill><span>{formatDate(b.updatedAt)}</span></div>
        <div className="sunat-error-body"><strong>{b.responseCode ? `Código ${b.responseCode}` : 'Sin código CDR'}</strong><p>{b.responseDescription || 'Sin descripción registrada.'}</p>{b.responseNotes?.map((note,i)=><p key={i}>• {note}</p>)}</div>
        {b.status==='UNCERTAIN' && <div className="sunat-guardrail"><ShieldAlert size={16}/> No reenvíes automáticamente este documento. Comprueba su estado antes de cualquier acción.</div>}
      </div>)}</div> : <SimpleEmpty title="Sin rechazos ni observaciones BETA registrados" detail="No significa que la conexión esté verificada: puede que todavía no se haya realizado ningún envío."/>}</section>
      {localErrors.length>0 && <section className="panel sunat-panel"><CardHeading icon={AlertCircle} title="Incidencias locales" subtitle="Procesamiento previo al envío BETA"/><div className="sunat-table-wrap"><table className="sunat-table"><thead><tr><th>Documento</th><th>Resultado</th><th>Detalle</th><th>Fecha</th></tr></thead><tbody>{localErrors.map(a=><tr key={a.id}><td><DocId doc={a.document}/></td><td>{a.result}</td><td className="sunat-detail-cell">{a.details || '—'}</td><td>{formatDate(a.createdAt)}</td></tr>)}</tbody></table></div></section>}
      </div>;
  }

  return <div className="page-container sunat-console">
    <div className="page-heading sunat-page-heading"><div><div className="eyebrow">CENTRO DE CONTROL TRIBUTARIO</div><h1>SUNAT · Conexión BETA</h1><p>Diagnóstico de integración, certificados, envíos y trazabilidad por empresa.</p></div><div className="sunat-heading-actions"><span className="sunat-beta-label"><span/> SOLO PRUEBAS</span><button className="btn btn-outline" disabled={!!busy} onClick={refresh}>{busy==='refresh'?<LoaderCircle className="spin" size={16}/>:<RefreshCw size={16}/>} Actualizar</button></div></div>
    <div className="sunat-hero"><div><span className="sunat-hero-kicker"><LockKeyhole size={14}/> ENTORNO SEGURO · SUNAT BETA</span><h2>Controla la integración desde un solo lugar</h2><p>Revisa la preparación del emisor, el acceso al servicio BETA y las respuestas registradas, sin utilizar producción ni exponer secretos.</p></div><div className="sunat-hero-lock"><ShieldCheck size={48}/><strong>PRODUCCIÓN BLOQUEADA</strong><span>Sin validez tributaria</span></div></div>
    {error && <div className="sunat-error-notice"><AlertCircle size={18}/><div><strong>No se pudo completar la operación</strong><p>{error}</p></div><button onClick={()=>setError(null)} aria-label="Cerrar alerta" className="icon-button"><XCircle size={16}/></button></div>}
    {!data ? <section className="panel sunat-panel sunat-unavailable"><WifiOff size={37}/><h2>La consola SUNAT aún no responde</h2><p>La opción ya está instalada en el frontend, pero no se pudo consultar <code>GET /api/v1/sunat/overview</code>. Puede que el backend esté sin actualizar, no esté disponible o que el administrador no tenga un RUC seleccionado.</p><div className="sunat-unavailable-checks"><span>1. Instala también el backend actualizado.</span><span>2. Comprueba <code>http://localhost:3000/health</code>.</span><span>3. Selecciona una empresa y actualiza esta pantalla.</span></div><button className="btn btn-primary" onClick={refresh} disabled={!!busy}>{busy==='refresh'?<LoaderCircle className="spin" size={16}/>:<RefreshCw size={16}/>} Volver a consultar</button></section> : <>
      <div className="sunat-metrics">
        <div className="sunat-metric"><div><span>Comprobantes locales</span><FileText size={18}/></div><strong>{data.metrics.totalDocuments}</strong><p>Registros de la empresa</p></div>
        <div className="sunat-metric"><div><span>XML preparados BETA</span><FileCode2 size={18}/></div><strong>{data.metrics.betaTotal}</strong><p>Firmados en laboratorio</p></div>
        <div className="sunat-metric"><div><span>Aceptados BETA</span><CheckCircle2 size={18}/></div><strong>{(counts.ACCEPTED||0)+(counts.ACCEPTED_WITH_OBSERVATIONS||0)}</strong><p>Solo pruebas, sin validez</p></div>
        <div className="sunat-metric"><div><span>Alertas BETA</span><AlertTriangle size={18}/></div><strong>{(counts.REJECTED||0)+(counts.UNCERTAIN||0)}</strong><p>Rechazos e incertidumbres</p></div>
      </div>
      <div className="sunat-tabs" role="tablist" aria-label="Secciones SUNAT">{TAB_NAMES.map(item=><button key={item.id} role="tab" aria-selected={tab===item.id} className={`sunat-tab ${tab===item.id?'sunat-tab-active':''}`} onClick={()=>setTab(item.id)}>{item.label}</button>)}</div>
      <div role="tabpanel">{tab==='overview'?renderOverview():tab==='configuration'?renderConfiguration():tab==='history'?renderHistory():renderErrors()}</div>
      <div className="sunat-bottom-alert"><ShieldAlert size={17}/><span><strong>Interpretación:</strong> conexión WSDL, certificado legible y XML preparado son pruebas distintas. La única validación de aceptación de un documento de laboratorio es su resultado CDR BETA; nunca equivale a una emisión real.</span></div>
    </>}
  </div>;
}
