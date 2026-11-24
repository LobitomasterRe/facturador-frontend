export type SunatCheckState = 'ok' | 'warning' | 'error';
export type SunatCheck = { id: string; title: string; state: SunatCheckState; detail: string };
export type SunatCertificateInfo = {
  configured: boolean; readable: boolean; valid: boolean; keyMatches: boolean;
  subject: string | null; issuer: string | null; validFrom: string | null; validTo: string | null;
  fingerprint256: string | null; detail: string;
};
export type SunatOverview = {
  environment: 'SUNAT_BETA_ONLY';
  company: { id: string; ruc: string; legalName: string; active: boolean };
  configuration: {
    pilotConfigured: boolean; pilotAuthorized: boolean; xsdConfigured: boolean; sendEnabled: boolean;
    serviceUrl: string; productionEnabled: false;
    secretsLocation: string;
    authentication: { mode: 'MODDATOS'; configured: boolean; note: string };
    certificate: SunatCertificateInfo;
  };
  checks: SunatCheck[];
  metrics: { totalDocuments: number; betaTotal: number; byStatus: Record<string, number> };
  attempts: Array<{
    id: string; mode: string; result: string; details: string | null; createdAt: string;
    document: { id: string; kind: string; series: string; number: number | null; customer: { name: string } };
  }>;
  betaDocuments: Array<{
    status: string; responseCode: string | null; responseDescription: string | null;
    responseNotes: string[]; updatedAt: string; sentAt: string | null; receivedAt: string | null;
    document: { id: string; kind: string; series: string; number: number | null };
  }>;
  warnings: string[];
};
export type SunatProbe = {
  checkedAt: string; result: 'reachable' | 'unexpected_response' | 'unreachable';
  httpStatus: number | null; latencyMs: number; detail: string; disclaimer: string;
};
