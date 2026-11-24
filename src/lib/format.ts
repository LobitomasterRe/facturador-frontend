import type { DocumentKind, DocumentStatus, Role } from './types';
export const money = (value: string | number | undefined | null) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value ?? 0));
export const quantity = (value: string | number | undefined) => new Intl.NumberFormat('es-PE', { maximumFractionDigits: 4 }).format(Number(value ?? 0));
export const dateTime = (date?: string | null) => date ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date)) : '—';
export const dateOnly = (date?: string | null) => date ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)) : '—';
export const kindName = (kind: DocumentKind) => kind === 'INVOICE' ? 'Factura' : 'Boleta';
export const roleName = (role: Role) => ({ TENANT_ADMIN: 'Administrador', BILLER: 'Facturador', VIEWER: 'Consulta' }[role]);
export const documentNumber = (doc: { series: string; number?: number | null }) => `${doc.series}-${doc.number ? String(doc.number).padStart(8, '0') : 'Sin número'}`;
export const statusDisplay: Record<DocumentStatus, { label: string; tone: 'gray' | 'blue' | 'amber' | 'green' | 'red' }> = {
  DRAFT: { label: 'Borrador', tone: 'gray' }, QUEUED: { label: 'En cola · prueba', tone: 'blue' }, PROCESSING: { label: 'Procesando · prueba', tone: 'amber' }, SIMULATED: { label: 'Simulado', tone: 'green' }, ERROR: { label: 'Error de prueba', tone: 'red' },
};
