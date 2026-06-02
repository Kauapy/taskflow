/**
 * Bateria de testes de segurança contra a API viva.
 *   npm run smoke:security
 *
 * Cobre: autenticação ausente/forjada, isolamento entre usuários,
 * SQL injection, XSS (armazenamento literal), path traversal em upload,
 * enumeração de e-mail, e limites.
 */
export {};

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000';
interface Json { [k: string]: unknown }

async function req(method: string, path: string, token?: string, body?: Json) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: (text ? JSON.parse(text) : null) as Json | null };
}
function assert(c: boolean, m: string): void { if (!c) throw new Error(m); }
async function signup(email: string) {
  const r = await req('POST', '/auth/signup', undefined, { email, password: 'senhaSegura123' });
  return (r.json as Json).token as string;
}

async function main(): Promise<void> {
  const ts = Date.now();
  let pass = 0;
  const ok = (m: string) => { pass++; console.log(`✅ ${m}`); }; // eslint-disable-line no-console

  // 1. Rota protegida sem token → 401
  assert((await req('GET', '/tasks')).status === 401, 'GET /tasks sem token deveria ser 401');
  ok('rota protegida exige token (401)');

  // 2. Token forjado/inválido → 401
  assert((await req('GET', '/tasks', 'lixo.token.invalido')).status === 401, 'token inválido deveria ser 401');
  // JWT com assinatura trocada
  const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYWNrIiwiZW1haWwiOiJoQGguY29tIn0.assinatura_errada';
  assert((await req('GET', '/tasks', fakeJwt)).status === 401, 'JWT forjado deveria ser 401');
  ok('JWT inválido/forjado rejeitado (401)');

  // 3. Isolamento entre usuários
  const alice = await signup(`sec-alice-${ts}@x.com`);
  const bob = await signup(`sec-bob-${ts}@x.com`);
  const t = await req('POST', '/tasks', alice, { title: 'Tarefa da Alice' });
  const taskId = ((t.json as Json).task as Json).id as string;
  assert((await req('PATCH', `/tasks/${taskId}`, bob, { title: 'invadido' })).status === 404, 'Bob não deveria editar tarefa da Alice');
  assert((await req('DELETE', `/tasks/${taskId}`, bob)).status === 404, 'Bob não deveria deletar tarefa da Alice');
  assert((await req('POST', `/tasks/${taskId}/complete`, bob)).status === 404, 'Bob não deveria concluir tarefa da Alice');
  assert(((await req('GET', '/tasks', bob)).json as Json).tasks instanceof Array && (((await req('GET', '/tasks', bob)).json as Json).tasks as unknown[]).length === 0, 'Bob não deveria ver tarefas da Alice');
  ok('isolamento entre usuários (404 + lista vazia)');

  // 4. SQL injection — payload malicioso é tratado como string literal
  // (sem espaço no fim: o backend faz .trim() no título)
  const inj = `Robert'); DROP TABLE tasks;--`;
  const injRes = await req('POST', '/tasks', alice, { title: inj });
  assert(injRes.status === 201, 'injeção deveria ser tratada como texto e criar a tarefa');
  assert(((injRes.json as Json).task as Json).title === inj, 'título deveria ser armazenado LITERALMENTE');
  // a tabela ainda existe? (GET funciona)
  assert((await req('GET', '/tasks', alice)).status === 200, 'tabela tasks deveria continuar existindo após injeção');
  ok('SQL injection neutralizada (query parametrizada)');

  // 5. XSS — script é armazenado literalmente (React escapa na renderização)
  const xss = `<script>alert('xss')</script>`;
  const xssRes = await req('POST', '/tasks', alice, { title: xss });
  assert(((xssRes.json as Json).task as Json).title === xss, 'payload XSS deveria ser armazenado como texto literal (sem sanitização destrutiva; o React escapa no render)');
  ok('XSS armazenado como dado literal (escape no front)');

  // 6. Path traversal no delete de upload — key fora da pasta do usuário → 403
  const trav = await req('DELETE', '/uploads', alice, { key: '../../../etc/passwd' });
  assert(trav.status === 403, `path traversal deveria dar 403, deu ${trav.status}`);
  const travOther = await req('DELETE', '/uploads', alice, { key: 'outro-user-id/arquivo.txt' });
  assert(travOther.status === 403, 'apagar arquivo de outro usuário deveria dar 403');
  ok('path traversal / delete cross-user bloqueado (403)');

  // 7. Enumeração de e-mail — login com inexistente vs senha errada: mesma resposta
  const r1 = await req('POST', '/auth/login', undefined, { email: `naoexiste-${ts}@x.com`, password: 'qualquer' });
  const r2 = await req('POST', '/auth/login', undefined, { email: `sec-alice-${ts}@x.com`, password: 'senhaErrada' });
  assert(r1.status === 401 && r2.status === 401, 'ambos deveriam ser 401');
  assert(Boolean((r1.json as Json).error) && Boolean((r2.json as Json).error), 'ambos com erro');
  const m1 = String(((r1.json as Json).error as Json).message);
  const m2 = String(((r2.json as Json).error as Json).message);
  assert(m1 === m2, `mensagens deveriam ser idênticas (anti-enumeração), vieram "${m1}" vs "${m2}"`);
  ok('anti-enumeração de e-mail (mensagem genérica idêntica)');

  // 8. Senha fraca rejeitada no signup (<6)
  const weak = await req('POST', '/auth/signup', undefined, { email: `weak-${ts}@x.com`, password: '123' });
  assert(weak.status === 400, 'senha fraca deveria dar 400');
  ok('senha curta rejeitada (400)');

  // 9. Validação de tipos — urgency inválida → 400
  const badUrg = await req('POST', '/tasks', alice, { title: 'x', urgency: 'altíssima' });
  assert(badUrg.status === 400, 'urgency inválida deveria dar 400');
  ok('validação de enum (urgency) (400)');

  // 10. Anexo com URL não-http (javascript:) rejeitado pela validação de URL do backend
  const badAtt = await req('POST', '/tasks', alice, { title: 'x', attachments: ['javascript:alert(1)'] });
  assert(badAtt.status === 400, `anexo javascript: deveria dar 400, deu ${badAtt.status}`);
  ok('anexo com esquema perigoso rejeitado (400)');

  // eslint-disable-next-line no-console
  console.log(`\n🎉 ${pass} testes de segurança passaram.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Teste de segurança falhou:', err instanceof Error ? err.message : err);
  process.exit(1);
});
