# Guía de instalación en Windows — Next.js + NestJS + PostgreSQL

## 0. Preparación

Instala Node.js 22 LTS, Docker Desktop (si usarás PostgreSQL con Docker) y VS Code. Abre PowerShell.

Mantén dos carpetas hermanas si usarás los proyectos separados:

```text
mis-proyectos/
  facturacion-nestjs-backend/
  facturacion-nextjs-frontend/
```

## 1. Backend primero (puerto 3000)

```powershell
cd .\facturacion-nestjs-backend
Copy-Item .env.example .env
notepad .env
```

Modifica contraseñas, `JWT_SECRET` (>=32 caracteres) y `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`.

```powershell
docker compose up -d postgres
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev
```

En otra terminal comprueba: http://localhost:3000/health y http://localhost:3000/api/docs.

## 2. Frontend (puerto 3001)

```powershell
cd .\facturacion-nextjs-frontend
Copy-Item .env.example .env.local
notepad .env.local
npm install
npm run dev
```

El `.env.local` debe incluir:

```env
BACKEND_URL=http://127.0.0.1:3000
APP_ORIGIN=http://localhost:3001
SSO_ALLOWED_ORIGINS=
```

Abre http://localhost:3001 y accede con el correo/contraseña del `seed` del backend.

## 3. Primer uso

1. Crear las 3 empresas en **Mis empresas**.
2. Agregar un administrador a cada una desde **Usuarios** en cada tarjeta (no todos usan el usuario de plataforma).
3. Seleccionar empresa.
4. Crear las series `F001` (facturas) y `B001` (boletas).
5. Registrar un cliente (RUC para factura; DNI o RUC para boleta).
6. Crear borrador de prueba y, desde su detalle, seleccionar **Simular emisión**.
7. Descargar PDF o XML de prueba. NO son comprobantes reales.

## 4. Si algo falla

- «No se pudo contactar con la API»: NestJS no está activo, `BACKEND_URL` incorrecto o base de datos no responde.
- «Indique tenantId»: el usuario pertenece a varias empresas; usa el campo avanzado con UUID de empresa que entrega NestJS.
- «Se requiere contexto de empresa»: inicia como admin de plataforma y selecciona una empresa antes de operar.
- «La serie no está registrada»: configura previamente F001 o B001.
- «HTTP 403»: revisa membresía y permisos de usuario. Viewer no crea comprobantes.
- Next.js no inicia por puerto ocupado: detén el proceso que usa 3001; no cambies el puerto sin ajustar `APP_ORIGIN` y el origen CORS del backend cuando corresponda.
- Si trabajas con Docker completo, `BACKEND_URL` debe señalar el servicio `api` dentro de Docker, no `localhost`.

## 5. Revisar

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

**Advertencia:** Next.js es un portal de prueba integrado al backend MOCK. Todavía no hay envíos reales a SUNAT.
