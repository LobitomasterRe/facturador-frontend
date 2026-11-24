# Nexo Facturación — Frontend Next.js / TypeScript

**Versión:** 1.0.0 · **Fecha:** 23 de noviembre de 2026 · **Arquitectura:** App Router + BFF + NestJS / PostgreSQL.

> **IMPORTANTE — MODO PRUEBA:** Este frontend consume el backend NestJS entregado previamente. El backend opera **solo en modo MOCK**. No envía comprobantes a SUNAT, no genera XML firmado, no emite CDR auténticas y **NO genera comprobantes tributarios válidos**. No usar para emisión comercial en producción.

## Funcionalidades disponibles (conectadas a APIs reales)

| Sección | Frontend | Backend utilizado |
|---|---|---|
| Inicio de sesión | Usuario + contraseña; cookie HttpOnly | `POST /api/v1/auth/login` |
| Inicio de sesión único (SSO) | Ticket de un uso por formulario POST | `POST /api/v1/auth/sso/exchange` |
| Panel de control | KPIs y gráfico con datos reales (hasta 100 registros) | `GET /documents`, `GET /customers`, `GET /tenant/series` |
| Empresas (administrador de plataforma) | Alta, listado, selección y miembros | `/system/tenants`, `/system/tenants/:id/members` |
| Comprobantes | Listar, buscar, filtrar y ver detalle | `GET /documents`, `GET /documents/:id` |
| Emisión simulada | Crear borrador, enviar a simulación y reintentar | `POST /documents`, `/submit`, `/retry` |
| Archivos de prueba | Descargar XML y PDF de vista previa | `/xml-preview`, `/pdf-preview` |
| Clientes | Listar y registrar | `GET/POST /customers` |
| Series | Listar y registrar | `GET/POST /tenant/series` |
| Equipo | Listar y crear membresías | `GET/POST /tenant/members` |
| Integraciones | Crear/revocar claves BILLING o SSO | `GET/POST/DELETE /tenant/api-keys` |
| Configuración | Datos del RUC y salud del backend | `GET /tenant/me` + `/health` |

### Principios técnicos

- **BFF (Backend for Frontend):** el navegador únicamente habla con Next.js (`/api/backend/...`). Next.js llama a NestJS desde el servidor. No se expone el JWT al código JavaScript del navegador.
- **Cookies de sesión:** `HttpOnly`, `SameSite=Lax`; `Secure` en producción HTTPS (excepción explícita para `http://localhost` durante pruebas locales con Docker). No se usa localStorage para JWT ni claves API.
- **Multitenancy:** el backend es la autoridad para `tenantId` y permisos. El administrador de plataforma selecciona un RUC que se envía en `x-tenant-id` al backend; la membresía de usuarios normales se valida en NestJS.
- **RBAC:** la interfaz oculta acciones según rol, pero **siempre son los guards de NestJS los que autorizan cada operación**.
- **Proxy con lista blanca:** únicamente reenvía rutas y métodos existentes en el backend proporcionado.
- **Sin datos inventados:** gráficos y tarjetas se construyen con respuestas del backend; si la API falla, se muestra advertencia. **Los listados actuales están limitados por el backend a 100 registros**; no se anuncian totales globales.
- **Idempotencia:** opcional `externalReference` para reconciliar ventas del software original.

## Requisitos

- Node.js 22 LTS recomendado (Next.js requiere Node >=20.9).
- npm, conexión a Internet para instalar dependencias.
- Backend NestJS y PostgreSQL previamente entregados, instalados y configurados.

## Puesta en marcha local (Windows / Linux / macOS)

1. Asegúrate de tener el backend activo en `http://localhost:3000` y PostgreSQL ejecutándose.
2. Copia `.env.example` a `.env.local` y ajusta `BACKEND_URL`:

   ```env
   BACKEND_URL=http://127.0.0.1:3000
   APP_ORIGIN=http://localhost:3001
   SSO_ALLOWED_ORIGINS=
   ```

3. Desde la carpeta del frontend:

   ```bash
   npm install
   npm run dev
   ```

4. Abre **http://localhost:3001**.
5. Inicia sesión con el usuario administrador creado mediante `npm run seed` en el backend.
6. Si eres administrador de plataforma: entra a **Empresas**, registra tus tres RUC, crea sus usuarios y abre una empresa.
7. Para una empresa: configura series (`F001`/`B001`), registra clientes y crea un borrador de prueba.

> No agregues el certificado digital ni la Clave SOL en Next.js. Su almacenamiento seguro, firma y envío real deberán implementarse en NestJS cuando se complete el motor tributario.

### Comandos

```bash
npm run dev          # Desarrollo puerto 3001
npm run build        # Compilar para despliegue
npm run start        # Servidor compilado puerto 3001
npm run typecheck    # Verificar tipos
npm run lint         # ESLint
npm test             # Pruebas de contrato / seguridad
```

### Docker

El `Dockerfile` produce una imagen Next.js `standalone` no privilegiada. Si Next.js se ejecuta en un contenedor separado de NestJS, **`BACKEND_URL=http://api:3000`** debe apuntar al nombre del servicio de backend en la misma red Docker; `localhost:3000` dentro del contenedor NO apunta a la API NestJS. Ver el paquete de pila completa, que incluye `docker-compose.yml` con ambos servicios.

### Integración desde tu software principal

**Modo API / servidor a servidor:** crea una clave `BILLING` desde Integraciones y consúmela exclusivamente desde el backend del software principal.

**Modo acceso directo al portal (SSO):** crea una clave `SSO`, genera tickets con el backend NestJS (`POST /api/v1/auth/sso/ticket`) usando el UUID de un usuario previamente habilitado, y transfiere el ticket por **formulario `POST`** a `https://TU_PORTAL/api/session/sso`. No utilizar enlaces con `?ticket=` ni guardar tokens en localStorage. Configura `SSO_ALLOWED_ORIGINS` cuando el dominio del software principal sea diferente.

Consulta [docs/INTEGRACION_SSO.md](docs/INTEGRACION_SSO.md).

## Organización de carpetas

```text
src/
  app/
    (auth)/login/              Pantalla de acceso
    (portal)/app/              Vistas protegidas del portal
      companies/              Administración plataforma
      documents/              Comprobantes y creación/detalle
      customers/              Receptores
      series/                 Numeración
      team/                   Usuarios
      integrations/           API keys + SSO
      settings/               Empresa y salud
    api/
      session/                Login/logout/selección empresa/SSO
      backend/[...path]/      Proxy de rutas autorizado
      health/                 Comprobación de disponibilidad
  components/                 Interfaz y formularios tipados
  lib/                        Tipos, API, seguridad, formato, sesión
```

## API que consume (IMPORTANTE)

El frontend está desarrollado **contra la versión 0.1.0 del backend entregado anteriormente**, no una supuesta API REST genérica de SUNAT. La API de NestJS está prefijada con `/api/v1`, mientras que el frontend tiene un proxy local `/api/backend` para proteger la sesión.

- `POST /api/v1/documents` acepta **`kind`, `customerId`, `seriesCode`, `externalReference?` y `lines` con `description`, `quantity`, `unitPrice` como cadenas decimales**.
- No existe endpoint de edición o borrado de comprobantes en la versión actual; la UI no presenta esos botones.
- Los números de comprobantes no se asignan al crear borradores; se asignan en `POST /documents/:id/submit`.
- El estado `SIMULATED` **no** corresponde a `ACCEPTED` de SUNAT.
- Los documentos PDF/XML son versiones de prueba; no existen CDR auténticas.

## Limitaciones y seguridad pendientes

- El backend MVP no dispone todavía de firma XMLDSig, validación tributaria completa, envío a SUNAT/OSE, consulta CDR ni acreditación contractual del modelo de servicios a terceros.
- Sin paginación en NestJS: solo últimos 100 comprobantes y 100 clientes por empresa. El frontend comunica esa limitación.
- Si un mismo usuario pertenece a varias empresas, el login original de NestJS requiere seleccionar un `tenantId` UUID. El formulario incluye campo avanzado. Para una experiencia de selección por nombre, hará falta extender el backend con flujo de preselección seguro.
- No se incluyen recuperación de contraseña, MFA, refresh tokens, gestión de sesiones múltiples ni subida de certificados porque no existen endpoints de backend para tales funciones.
- Antes de producción: auditoría de seguridad, TLS, CSP, limitación de tasa, observabilidad, pruebas end-to-end contra PostgreSQL, políticas de retención, backups y revisión jurídica PSE/OSE según el modelo comercial.

## Más documentación

- [Guía detallada para Windows](INICIO_WINDOWS.md)
- [SSO e integración con tu software](docs/INTEGRACION_SSO.md)
- [Seguridad y límites del MVP](docs/SEGURIDAD.md)
- [Validación de esta entrega](VALIDACION_ENTREGA.md)

Referencias: [Next.js App Router](https://nextjs.org/docs/app) · [Next.js BFF](https://nextjs.org/docs/app/guides/backend-for-frontend) · [SUNAT CPE](https://cpe.sunat.gob.pe/guias-y-manuales)
