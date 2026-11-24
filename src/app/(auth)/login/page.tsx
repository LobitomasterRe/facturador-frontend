'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Eye, EyeOff, ShieldCheck, ReceiptText, Layers3, CircleCheck, Building2 } from 'lucide-react';
import { FormError, LoadingButton } from '@/components/ui';
export default function LoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [tenantId, setTenantId] = useState('');
  const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState<string|null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await fetch('/api/session/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, ...(tenantId ? { tenantId } : {}) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Credenciales incorrectas');
      router.replace(data.user.platformAdmin ? '/app/companies' : '/app'); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  return <div className="login-page">
    <div className="login-hero"><div className="login-hero-content"><div className="login-brand"><div className="brand-logo"><ReceiptText size={25}/></div><span>NEXO <b>FACTURACIÓN</b></span></div>
      <div className="login-hero-body"><span className="hero-eyebrow"><span/> UNA SOLA PLATAFORMA. MÚLTIPLES EMPRESAS.</span><h1>Facturación simple.<br/><em>Gestión inteligente.</em></h1><p>Todo lo que tu empresa necesita para gestionar comprobantes, clientes y operaciones desde un espacio seguro y organizado.</p>
      <div className="hero-feature"><div><Layers3 size={20}/></div><span><strong>Multiempresa de verdad</strong><small>Información y permisos aislados por RUC.</small></span></div>
      <div className="hero-feature"><div><ShieldCheck size={20}/></div><span><strong>Acceso protegido</strong><small>Sesiones seguras e integración por API.</small></span></div>
      <div className="hero-feature"><div><CircleCheck size={20}/></div><span><strong>Listo para integrar</strong><small>Conecta tu software actual sin duplicar datos.</small></span></div></div>
      <div className="hero-footer">Diseñado para crecer contigo · Plataforma de demostración</div>
    </div></div>
    <div className="login-form-side"><div className="login-form-wrapper"><div className="login-mobile-brand"><ReceiptText size={24}/> NEXO</div>
      <div className="login-icon"><LockKeyhole size={23}/></div><h2>Bienvenido de nuevo</h2><p className="login-subtitle">Accede a tu espacio de facturación.</p>
      <form className="login-form" onSubmit={submit}>
        <label className="field"><span className="field-label">Correo electrónico</span><input autoComplete="username" type="email" placeholder="nombre@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required/></label>
        <label className="field"><span className="field-label">Contraseña</span><div className="password-field"><input autoComplete="current-password" type={show ? 'text' : 'password'} placeholder="Ingresa tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required/><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
        <details className="login-advanced"><summary><Building2 size={15}/> ¿Tienes acceso a más de una empresa?</summary><label className="field"><span className="field-label">ID de empresa (tenantId)</span><input value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="UUID de la empresa"/><span className="field-hint">Solo necesario cuando tu usuario pertenece a varias empresas.</span></label></details>
        <FormError message={error}/><LoadingButton loading={loading} className="btn btn-primary login-submit" type="submit">Ingresar a mi cuenta <ArrowRight size={18}/></LoadingButton>
      </form>
      <div className="login-disclaimer"><ShieldCheck size={16}/><span>Acceso reservado a usuarios autorizados. Los comprobantes de este entorno son únicamente de prueba.</span></div>
      <p className="login-help">¿Necesitas acceso? Contacta al administrador de tu plataforma.</p>
    </div></div>
  </div>;
}
