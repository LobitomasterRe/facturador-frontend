import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='src/app/api';
test('Endpoints autenticación implementados en el BFF',()=>{
  for(const name of ['session/login','session/logout','session/tenant','session/sso','backend/[...path]','health']){
    assert.equal(fs.existsSync(`${base}/${name}/route.ts`),true,`Falta ${name}`);
  }
});
test('Comprobantes usan el contrato real NestJS',()=>{
  const dto=fs.readFileSync('src/components/document-create.tsx','utf8');
  for(const name of ['kind','customerId','seriesCode','externalReference','description','quantity','unitPrice'])assert.equal(dto.includes(name),true,`Falta campo ${name}`);
  assert.match(dto,/browserApi<Invoice>\('documents'/);
});
test('Existe advertencia explícita de validez tributaria',()=>{
  const dashboard=fs.readFileSync('src/app/(portal)/app/page.tsx','utf8');
  const detail=fs.readFileSync('src/app/(portal)/app/documents/[id]/page.tsx','utf8');
  assert.match(dashboard,/(?:no|ni) tienen validez tributaria/i);
  assert.match(detail,/carecen de validez tributaria/i);
});
