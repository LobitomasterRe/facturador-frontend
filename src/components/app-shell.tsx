'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, ReceiptText, UsersRound, Layers, KeyRound, Settings2, Building2,
  LogOut, ChevronDown, Menu, ShieldCheck, ArrowUpRight, PanelLeftClose,
  UserRoundCog, FilePlus2, ExternalLink, RadioTower
} from 'lucide-react';
import type { Actor, Tenant } from '@/lib/types';
import { ToastProvider, useToast } from './ui';
interface Props { actor: Actor; selectedTenant: Tenant | null; tenants: Tenant[]; children: React.ReactNode }
const menu = [
  { href: '/app', title: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/app/documents', title: 'Comprobantes', icon: ReceiptText },
  { href: '/app/customers', title: 'Clientes', icon: UsersRound },
  { href: '/app/series', title: 'Series y correlativos', icon: Layers },
  { href: '/app/sunat', title: 'SUNAT · Conexión BETA', icon: RadioTower, admin: true },
  { href: '/app/team', title: 'Equipo y permisos', icon: UserRoundCog, admin: true },
  { href: '/app/integrations', title: 'Integraciones API', icon: KeyRound, admin: true },
  { href: '/app/settings', title: 'Configuración', icon: Settings2 },
];
function Shell({ actor, selectedTenant, tenants, children }: Props) {
  const path = usePathname(); const router = useRouter(); const { push } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const platform = actor.platformAdmin;
  const isAdmin = platform || actor.role === 'TENANT_ADMIN';
  const canWrite = platform || actor.role !== 'VIEWER';
  const shortName = selectedTenant?.legalName || 'Sin empresa seleccionada';
  async function switchCompany(id: string | null) {
    setBusy(true);
    try {
      const res = await fetch('/api/session/tenant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: id }) });
      if (!res.ok) throw new Error('No se pudo cambiar de empresa');
      setCompanyOpen(false); setMobileOpen(false);
      router.push(id ? '/app' : '/app/companies'); router.refresh();
    } catch (e) { push((e as Error).message, 'error'); } finally { setBusy(false); }
  }
  async function logout() { await fetch('/api/session/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); }
  return <div className="app-frame">
    {mobileOpen && <button className="mobile-shade" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-logo"><ReceiptText size={24} strokeWidth={2.4}/></div><div className="brand-copy"><strong>NEXO</strong><span>FACTURACIÓN</span></div><button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><PanelLeftClose size={20}/></button></div>
      <div className="sidebar-section-label">ESPACIO DE TRABAJO</div>
      <div className="company-holder">
        <button type="button" className="company-switcher" onClick={() => platform && setCompanyOpen(!companyOpen)} aria-expanded={companyOpen} disabled={!platform || busy}>
          <div className="company-avatar"><Building2 size={19}/></div>
          <div className="company-summary"><strong title={shortName}>{shortName}</strong><span>{selectedTenant ? `RUC ${selectedTenant.ruc}` : 'Selecciona un RUC'}</span></div>
          {platform && <ChevronDown size={15} className="chevron"/>}
        </button>
        {platform && companyOpen && <div className="company-popover"><div className="company-popover-heading">Cambiar empresa</div>{tenants.filter(t=>t.active).map(t => <button key={t.id} className={`company-choice ${selectedTenant?.id === t.id ? 'selected' : ''}`} onClick={() => switchCompany(t.id)}><span>{t.legalName}</span><small>{t.ruc}</small></button>)}<button className="company-choice all-companies" onClick={() => switchCompany(null)}>Administrar empresas <ArrowUpRight size={15}/></button></div>}
      </div>
      <nav className="side-nav" aria-label="Menú principal">
        <div className="nav-section-title">PRINCIPAL</div>
        {(platform ? [{ href: '/app/companies', title: 'Empresas', icon: Building2 }, ...menu] : menu).filter(m => (!('admin' in m) || isAdmin) && (selectedTenant || m.href === '/app/companies')).map(({ href, title, icon: Icon, ...m }) => {
          const active = path === href || (!('exact' in m) && path.startsWith(href + '/'));
          return <Link key={href} href={href} className={`nav-link ${active ? 'nav-active' : ''}`} onClick={() => setMobileOpen(false)}><Icon size={19} strokeWidth={1.9}/><span>{title}</span></Link>;
        })}
      </nav>
      <div className="sidebar-bottom"><div className="sandbox-panel"><div className="sandbox-symbol"><ShieldCheck size={18}/></div><strong>Entorno de simulación</strong><p>Laboratorio SUNAT BETA. No produce comprobantes tributarios reales.</p><a href="https://cpe.sunat.gob.pe/guias-y-manuales" target="_blank" rel="noopener noreferrer">Documentación SUNAT <ExternalLink size={12}/></a></div>
        <button type="button" className="logout-link" onClick={logout}><LogOut size={18}/> Cerrar sesión</button>
      </div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menú"><Menu size={22}/></button><span className="breadcrumb-root">Plataforma</span><span className="breadcrumb-divider">/</span><span className="breadcrumb-current">{path === '/app' ? 'Resumen' : path.split('/').filter(Boolean).slice(-1)[0].replaceAll('-', ' ')}</span></div>
        <div className="topbar-actions"><span className="environment-pill"><span/> MODO PRUEBA</span>{canWrite && selectedTenant && <Link href="/app/documents/new" className="btn btn-primary btn-sm topbar-create"><FilePlus2 size={16}/> Nuevo comprobante</Link>}<div className="user-avatar" aria-label="Usuario conectado">{platform ? 'SP' : actor.role === 'TENANT_ADMIN' ? 'AD' : 'US'}</div></div>
      </header>
      <main className="content">{children}</main>
      <footer className="app-footer"><span>Nexo Facturación · Entorno de desarrollo</span><span>XML y PDF sin validez tributaria</span></footer>
    </div>
  </div>;
}
export function AppShell(props: Props) { return <ToastProvider><Shell {...props}/></ToastProvider>; }
