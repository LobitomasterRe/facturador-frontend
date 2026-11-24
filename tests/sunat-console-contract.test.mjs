import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(path,'utf8');
test('Consola SUNAT aparece en navegación y tiene ruta propia', () => {
  assert.match(read('src/components/app-shell.tsx'), /\/app\/sunat/);
  assert.match(read('src/app/(portal)/app/sunat/page.tsx'), /SunatConsole/);
});
test('La consola no desaparece si falla la consulta del backend', () => {
  const page = read('src/app/(portal)/app/sunat/page.tsx');
  const component = read('src/components/sunat-console.tsx');
  assert.match(page, /catch\(\(\) => null\)/);
  assert.match(component, /La consola SUNAT aún no responde/);
  assert.match(component, /Volver a consultar/);
});
test('El estado BETA fallido se muestra en detalle, en lugar de ocultarse', () => {
  const detail = read('src/app/(portal)/app/documents/[id]/page.tsx');
  assert.match(detail, /Centro de control SUNAT/);
  assert.match(detail, /betaStatus\s*\?/);
});
test('Configura secretos solo en el backend y mantiene producción bloqueada', () => {
  const component = read('src/components/sunat-console.tsx');
  assert.match(component, /PRODUCCIÓN BLOQUEADA/);
  assert.match(component, /SUNAT_BETA_SEND_ENABLED=false/);
  assert.doesNotMatch(component, /NEXT_PUBLIC_SUNAT_BETA_KEY/);
  assert.doesNotMatch(component, /localStorage\./);
});
