# Validación de entrega — 23/11/2026

## Verificaciones realizadas

- Revisión directa del backend NestJS proporcionado en `/mnt/data/facturacion-nestjs-backend`.
- Comprobación de coincidencia de nombres de rutas, DTOs, roles y modelos Prisma antes de implementar componentes.
- Análisis sintáctico de los archivos TypeScript y TSX mediante el compilador TypeScript disponible globalmente.
- Verificación de rutas locales de importación y archivos presentes en el proyecto.
- Pruebas unitarias de patrones de rutas autorizadas y seguridad básica del BFF, mediante el runner incluido.
- Revisión de que las rutas de descargas son `xml-preview` y `pdf-preview` y de que los estados son `DRAFT`, `QUEUED`, `PROCESSING`, `SIMULATED` y `ERROR`.

## No verificable en este entorno

La descarga de dependencias npm no estuvo disponible de forma confiable durante la generación. Por ello **no se pudo ejecutar `npm run build`, `npm run typecheck`, `npm run lint` contra dependencias reales de Next.js, ni pruebas de navegador contra el backend PostgreSQL**. Debe ejecutarse esta batería en el equipo de destino tras `npm install` y con la API real levantada.

## Limitación funcional intencional

Este frontend usa el MVP NestJS en modo MOCK. Los archivos y operaciones son exclusivamente de simulación; no se han inventado conexiones a SUNAT, CDR, firmas electrónicas ni aprobación tributaria.
