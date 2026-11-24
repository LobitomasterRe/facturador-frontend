# Integración del portal Next.js con tu software actual (opción C)

## Modo 1 — API técnica

1. El administrador de empresa crea una clave **BILLING** desde Integraciones del portal.
2. El backend de tu sistema original guarda la clave en variables de entorno o gestor de secretos.
3. Cuando registra una venta, tu backend llama a NestJS `POST /api/v1/documents` con `x-api-key`, siempre con un `externalReference` estable.
4. Recibe un documento con estado `DRAFT` e `id`.
5. Opcionalmente solicita la simulación `POST /api/v1/documents/:id/submit`. No representa emisión real.
6. Consulta `GET /api/v1/documents/:id` hasta obtener `SIMULATED` o `ERROR`.

**No** llames a NestJS con la clave BILLING desde el navegador del software original: podría ser copiada por cualquiera que abra las herramientas del desarrollador.

## Modo 2 — Portal integrado con SSO

### Requisito previo

El usuario debe existir ya en NestJS y tener una membresía válida en el `tenantId` correspondiente. La API no crea automáticamente usuarios vía SSO.

### Flujo seguro

```text
Usuario autentica en tu software
          |
          v
Tu backend comprueba membresía y busca el UUID de usuario del portal
          |
          v
Tu backend --> NestJS POST /api/v1/auth/sso/ticket
               x-api-key: fe_<CLAVE_SSO> (solo servidor)
               { "userId": "UUID" }
          |
          v
NestJS devuelve {"ticket":"64 hex","validForSeconds":60}
          |
          v
Tu backend genera página HTML breve con formulario POST oculto:
   action="https://tu-portal.com/api/session/sso"
   input name="token" value="<ticket>"
          |
          v
El navegador hace POST (no se envía ticket en la URL)
          |
          v
Next.js BFF --> NestJS POST /api/v1/auth/sso/exchange
          |
          v
Next.js recibe JWT, lo guarda en cookie HttpOnly y redirige a /app
```

Ejemplo mínimo de formulario servido por **tu backend original** (interpolar el ticket HTML-escapado, nunca guardar en logs):

```html
<!doctype html>
<html lang="es">
<head><meta name="referrer" content="no-referrer" /></head>
<body>
<form id="sso" method="post" action="https://TU-PORTAL/api/session/sso">
  <input type="hidden" name="token" value="TICKET_DE_UN_USO_ESCAPADO" />
  <noscript><button type="submit">Acceder a facturación</button></noscript>
</form>
<script>document.getElementById('sso').submit();</script>
</body></html>
```

La respuesta HTML debe incluir `Cache-Control: no-store` y `Referrer-Policy: no-referrer`. No poner tickets en `location.href`, query strings, analítica, logs, ni mensajes que queden persistidos. Para dominios diferentes, configura `SSO_ALLOWED_ORIGINS=https://tu-software.com`. Sin esta configuración, Next.js rechaza solicitudes externas por defecto.

## Conceptos de seguridad

- Claves separadas: `BILLING` no permite crear tickets y `SSO` no permite emitir.
- El ticket es de 60 segundos y un solo uso, consumido de forma atómica por NestJS.
- El token JWT solo se envía entre servidores. El browser recibe una cookie `HttpOnly`.
- El frontend aplica una lista blanca de operaciones, pero NestJS sigue siendo la autoridad de autorización.
- La selección de empresa por administrador se valida contra `GET /system/tenants` antes de establecer el contexto.
- Usa HTTPS, controles de sesión y una auditoría de seguridad antes de permitir acceso desde Internet.
