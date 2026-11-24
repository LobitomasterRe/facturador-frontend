'use client';
import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X, Inbox, LoaderCircle } from 'lucide-react';
import { statusDisplay } from '@/lib/format';
import type { DocumentStatus } from '@/lib/types';

type Toast = { id: number; text: string; tone: 'error' | 'success' };
const ToastCtx = createContext<{ push: (text: string, tone?: Toast['tone']) => void }>({ push: () => undefined });
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (text: string, tone: Toast['tone'] = 'success') => setToasts(items => [...items, { id: Date.now() + Math.random(), text, tone }]);
  useEffect(() => {
    if (toasts.length === 0) return;
    const timeout = window.setTimeout(() => setToasts(items => items.slice(1)), 4800);
    return () => window.clearTimeout(timeout);
  }, [toasts]);
  return <ToastCtx.Provider value={{ push }}>{children}<div className="toast-stack" role="status" aria-live="polite">{toasts.map(t => <div key={t.id} className={`toast toast-${t.tone}`}>
    {t.tone === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{t.text}</span>
    <button type="button" className="icon-button" aria-label="Cerrar notificación" onClick={() => setToasts(items => items.filter(x => x.id !== t.id))}><X size={16}/></button>
  </div>)}</div></ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);
export function StatusBadge({ status }: { status: DocumentStatus }) { const value = statusDisplay[status]; return <span className={`status-tag status-${value.tone}`}><span className="status-dot"/>{value.label}</span>; }
export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon ?? <Inbox size={25}/>}</div><h3>{title}</h3><p>{description}</p>{action && <div className="empty-action">{action}</div>}</div>;
}
export function LoadingButton({ loading, children, className = 'btn btn-primary', disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return <button className={className} disabled={loading || disabled} {...props}>{loading && <LoaderCircle size={16} className="spin"/>}{children}</button>;
}
export function Modal({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-label={title}>
    <div className="modal-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={20}/></button></div>
    <div className="modal-body">{children}</div>
  </div></div>;
}
export function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return <label className="field"><span className="field-label">{label}{required && <b className="required"> *</b>}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
export function FormError({ message }: { message: string | null }) { return message ? <div className="form-error"><AlertCircle size={17}/>{message}</div> : null; }
export function InfoBanner({ children, variant = 'info' }: { children: ReactNode; variant?: 'info' | 'warning' }) {
  return <div className={`info-banner info-${variant}`}><AlertCircle size={18}/><div>{children}</div></div>;
}
