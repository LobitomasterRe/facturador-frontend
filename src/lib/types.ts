export type DocumentKind = 'INVOICE' | 'RECEIPT';
export type DocumentStatus = 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'SIMULATED' | 'ERROR';
export type Role = 'TENANT_ADMIN' | 'BILLER' | 'VIEWER';
export type ApiKeyScope = 'BILLING' | 'SSO';
export interface Actor { userId: string | null; tenantId: string | null; platformAdmin: boolean; role: Role | null; viaApiKey: boolean; apiKeyScope: ApiKeyScope | null }
export interface Tenant { id: string; slug: string; ruc: string; legalName: string; address: string; ubigeo?: string | null; active: boolean; createdAt: string; updatedAt: string }
export interface Membership { tenantId: string; company: string; role: Role }
export interface LoginResponse { accessToken: string; tokenType: string; tenantId: string | null; user: { id: string; name: string; email: string; platformAdmin: boolean }; memberships: Membership[] }
export interface Customer { id: string; tenantId: string; documentType: '1'|'6'; documentNumber: string; name: string; email?: string | null; address?: string | null; createdAt: string }
export interface Series { id: string; tenantId: string; code: string; kind: DocumentKind; nextNumber: number; createdAt: string }
export interface DocumentLine { id: string; position: number; description: string; quantity: string | number; unitPrice: string | number; subtotal: string | number; taxAmount: string | number; total: string | number }
export interface SubmissionAttempt { id: string; mode: string; result: string; details?: string | null; createdAt: string }
export interface Invoice { id: string; tenantId: string; kind: DocumentKind; status: DocumentStatus; series: string; number?: number | null; externalReference?: string | null; customerId: string; customer?: Customer | Pick<Customer, 'name' | 'documentNumber'>; issueDate?: string | null; subtotal: string | number; taxAmount: string | number; total: string | number; taxRate: string | number; lastError?: string | null; simulatedAt?: string | null; createdAt: string; updatedAt: string; lines?: DocumentLine[]; attempts?: SubmissionAttempt[] }
export interface TenantMember { tenantId: string; userId: string; role: Role; createdAt: string; user: { id: string; name: string; email: string; active: boolean } }
export interface ApiKey { id: string; name: string; prefix: string; scope: ApiKeyScope; active: boolean; createdAt: string; lastUsedAt: string | null }
export interface CreatedApiKey { id: string; name: string; scope: ApiKeyScope; apiKey: string; warning: string }
export interface ApiErrorResponse { statusCode?: number; message?: string | string[]; error?: string }
