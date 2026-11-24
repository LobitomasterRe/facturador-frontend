import type { Metadata } from 'next';
import './globals.css';
import './sunat-console.css';
export const metadata: Metadata = {
  title: { default: 'Nexo | Facturación', template: '%s | Nexo Facturación' },
  description: 'Gestión de facturación y comprobantes de prueba para múltiples empresas.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
