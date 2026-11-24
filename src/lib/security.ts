export function sameOrigin(request: Request, extraOrigins: string[] = []): boolean {
  const origin = request.headers.get('origin');
  const allowed = [process.env.APP_ORIGIN || new URL(request.url).origin, ...extraOrigins];
  if (origin && !allowed.includes(origin)) return false;
  const site = request.headers.get('sec-fetch-site');
  // Browsers send Origin for unsafe cross-site form/fetch; additionally reject cross-site fetch metadata.
  if (site === 'cross-site' && (!origin || !extraOrigins.includes(origin))) return false;
  return true;
}
export function validUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
export function allowedBackendRoute(method: string, parts: string[]): boolean {
  const [a,b,c,d] = parts;
  if (parts.some(s => !/^[a-zA-Z0-9_-]+$/.test(s))) return false;
  if (method === 'GET') {
    if (parts.length === 2 && ((a === 'auth' && b === 'me') || (a === 'tenant' && ['me','members','series','api-keys'].includes(b)) || (a === 'system' && b === 'tenants'))) return true;
    if (parts.length === 1 && ['customers','documents'].includes(a)) return true;
    if (parts.length === 2 && a === 'sunat' && b === 'overview') return true;
    if (a === 'documents' && validUuid(b) && (parts.length === 2 || (parts.length === 3 && ['xml-preview','pdf-preview'].includes(c)))) return true;
    if (parts.length === 4 && a === 'documents' && validUuid(b) && c === 'beta' && ['status','signed-xml','cdr-xml','cdr-zip'].includes(d)) return true;
  }
  if (method === 'POST') {
    if (parts.length === 2 && a === 'sunat' && b === 'diagnostics') return true;
    if (parts.length === 1 && ['customers','documents'].includes(a)) return true;
    if (parts.length === 2 && ((a === 'system' && b === 'tenants') || (a === 'tenant' && ['members','series','api-keys'].includes(b)))) return true;
    if (parts.length === 4 && a === 'system' && b === 'tenants' && validUuid(c) && d === 'members') return true;
    if (parts.length === 3 && a === 'documents' && validUuid(b) && ['submit','retry'].includes(c)) return true;
    if (parts.length === 4 && a === 'documents' && validUuid(b) && c === 'beta' && ['prepare','send'].includes(d)) return true;
  }
  if (method === 'DELETE' && parts.length === 3 && a === 'tenant' && b === 'api-keys' && validUuid(c)) return true;
  return false;
}
