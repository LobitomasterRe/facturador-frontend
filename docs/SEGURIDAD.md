# Controles de seguridad — Frontend

## Implementados

- BFF de Next.js (`/api/backend/[...path]`): API privada del frontend, sin token retornado al navegador.
- JWT de NestJS en cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción excepto pruebas locales explícitas con `APP_ORIGIN=http://localhost:3001`, `Path=/`. No exponer un entorno HTTP por Internet.
- Lista blanca explícita de métodos y rutas del backend. No es un proxy abierto.
- Mutaciones protegidas por validación de `Origin` y `Sec-Fetch-Site`; SSO externo solamente por dominio permitido mediante `SSO_ALLOWED_ORIGINS`.
- Solicitudes JSON limitadas a 64 KiB para el proxy de escritura (una factura admite hasta 100 líneas conforme al backend).
- Los documentos se descargan mediante el BFF, no mediante URLs que contengan JWT.
- Navegación por permisos y contexto de empresa; NestJS aplica reglas RBAC reales.
- Caché deshabilitada para respuestas de API; cookies de sesión no accesibles a scripts del navegador.
- Los datos de ingresos siempre proceden del backend, sin datos de ejemplo que simulen operaciones reales.

## Pendientes para despliegue externo

- Penetration test de sesiones, SSO, aislamiento de datos, permisos y reverso proxy.
- Límite de intentos de login y rate-limiting (backend/reverse proxy).
- Refresh token, revocación centralizada de sesiones, MFA para administradores.
- CSP robusta sin scripts inseguros; cabeceras HSTS, aislamiento de dominios y certificados TLS.
- Logs estructurados sin contraseñas, JWT, tickets ni API keys; auditoría de accesos.
- Revisiones de dependencias (`npm audit`), builds reproducibles con `package-lock.json` generado en entorno con npm.
- Pruebas E2E reales con PostgreSQL y NestJS, incluyendo expiración de JWT, conflictos de serie y error 403.
- El backend actual carece de envío SUNAT; nunca presentar PDFs/XML de prueba como comprobantes tributarios válidos.
