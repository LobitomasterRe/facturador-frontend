import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function loadTypeScript(relative) {
  const input=fs.readFileSync(path.join(process.cwd(),relative),'utf8');
  const {outputText}=ts.transpileModule(input,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  const exports={}; const env={exports,Request,URL,process};
  vm.runInNewContext(outputText,env,{filename:relative});
  return exports;
}
const {validUuid,allowedBackendRoute,sameOrigin}=loadTypeScript('src/lib/security.ts');
const id='123e4567-e89b-42d3-a456-426614174000';
test('API permite únicamente métodos y rutas reales NestJS',()=>{
  assert.equal(allowedBackendRoute('GET',['documents']),true);
  assert.equal(allowedBackendRoute('POST',['documents']),true);
  assert.equal(allowedBackendRoute('POST',['documents',id,'submit']),true);
  assert.equal(allowedBackendRoute('POST',['system','tenants',id,'members']),true);
  assert.equal(allowedBackendRoute('DELETE',['tenant','api-keys',id]),true);
  assert.equal(allowedBackendRoute('GET',['documents',id,'pdf-preview']),true);
  assert.equal(allowedBackendRoute('GET',['documents',id,'xml-preview']),true);
  assert.equal(allowedBackendRoute('GET',['sunat','overview']),true);
  assert.equal(allowedBackendRoute('POST',['sunat','diagnostics']),true);
  assert.equal(allowedBackendRoute('POST',['sunat','overview']),false);
  assert.equal(allowedBackendRoute('GET',['sunat','diagnostics']),false);
  assert.equal(allowedBackendRoute('POST',['sunat','production']),false);
  assert.equal(allowedBackendRoute('GET',['documents',id,'beta','status']),true);
  assert.equal(allowedBackendRoute('GET',['documents',id,'beta','signed-xml']),true);
  assert.equal(allowedBackendRoute('GET',['documents',id,'beta','cdr-zip']),true);
  assert.equal(allowedBackendRoute('POST',['documents',id,'beta','prepare']),true);
  assert.equal(allowedBackendRoute('POST',['documents',id,'beta','send']),true);
  assert.equal(allowedBackendRoute('POST',['documents',id,'beta','production']),false);
  assert.equal(allowedBackendRoute('POST',['documents',id,'beta','retry']),false);
  assert.equal(allowedBackendRoute('POST',['auth','login']),false);
  assert.equal(allowedBackendRoute('PUT',['documents',id]),false);
  assert.equal(allowedBackendRoute('DELETE',['documents',id]),false);
  assert.equal(allowedBackendRoute('GET',['../../admin']),false);
  assert.equal(allowedBackendRoute('GET',['documents','not-a-uuid']),false);
  assert.equal(allowedBackendRoute('POST',['tenant','api-keys',id]),false);
});
test('UUID inválido bloquea rutas sensibles',()=>{
  assert.equal(validUuid(id),true);
  assert.equal(validUuid('../path'),false);
});
test('Origen de escritura no autorizado es rechazado',()=>{
  const allowed = new Request('http://localhost:3001/api/backend/documents',{headers:{Origin:'http://localhost:3001','Sec-Fetch-Site':'same-origin'}});
  const external = new Request('http://localhost:3001/api/backend/documents',{headers:{Origin:'https://otro-dominio.com','Sec-Fetch-Site':'cross-site'}});
  assert.equal(sameOrigin(allowed),true);
  assert.equal(sameOrigin(external),false);
  assert.equal(sameOrigin(external,['https://otro-dominio.com']),true);
});
test('Ninguna vista cliente contiene credenciales técnicas',()=>{
  const root='src/components';
  for(const file of fs.readdirSync(root)){
    if(!file.endsWith('.tsx'))continue;
    const src=fs.readFileSync(path.join(root,file),'utf8');
    assert.doesNotMatch(src,/localStorage\.(setItem|getItem)/);
    assert.doesNotMatch(src,/NEXT_PUBLIC_.*(?:TOKEN|KEY|SECRET)/);
  }
});
