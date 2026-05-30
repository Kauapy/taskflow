/**
 * Smoke test manual de compartilhamento (Fase D).
 *   npm run smoke:shares
 *
 * Cobre: compartilhar por e-mail, erros (self/inexistente/duplicado),
 * convites recebidos, aceitar, link público (gerar, acessar sem auth,
 * contador, revogar → 404).
 */
export {};

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000';

interface Json { [k: string]: unknown }

async function req(method: string, path: string, token?: string, body?: Json) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: (text ? JSON.parse(text) : null) as Json | null };
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

async function signup(email: string) {
  const r = await req('POST', '/auth/signup', undefined, { email, password: 'senhaSegura123' });
  assert(r.status === 201, `signup falhou: ${r.status}`);
  return (r.json as Json).token as string;
}

async function main(): Promise<void> {
  const ts = Date.now();
  const aliceEmail = `alice-${ts}@example.com`;
  const bobEmail = `bob-${ts}@example.com`;

  const alice = await signup(aliceEmail);
  const bob = await signup(bobEmail);
  // eslint-disable-next-line no-console
  console.log('✅ Alice e Bob criados');

  // Alice cria uma tarefa
  const taskRes = await req('POST', '/tasks', alice, { title: 'Planejar TCC', urgency: 'alta' });
  const taskId = ((taskRes.json as Json).task as Json).id as string;

  // ── Compartilhar por e-mail ──
  // self-share → 400
  const self = await req('POST', '/shares', alice, { taskId, email: aliceEmail });
  assert(self.status === 400, `self-share deveria dar 400, deu ${self.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ self-share bloqueado (400)');

  // e-mail inexistente → 404
  const ghost = await req('POST', '/shares', alice, { taskId, email: `ghost-${ts}@x.com` });
  assert(ghost.status === 404, `e-mail inexistente deveria dar 404, deu ${ghost.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ e-mail inexistente bloqueado (404)');

  // compartilhar com Bob → 201
  const share = await req('POST', '/shares', alice, { taskId, email: bobEmail });
  assert(share.status === 201, `compartilhar falhou: ${share.status} ${JSON.stringify(share.json)}`);
  // eslint-disable-next-line no-console
  console.log('✅ compartilhado com Bob (201)');

  // duplicado → 409
  const dup = await req('POST', '/shares', alice, { taskId, email: bobEmail });
  assert(dup.status === 409, `duplicado deveria dar 409, deu ${dup.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ compartilhamento duplicado bloqueado (409)');

  // Bob vê o convite pendente
  const incoming = await req('GET', '/shares/incoming', bob);
  const list = (incoming.json as Json).incoming as Json[];
  assert(list.length === 1, `Bob deveria ter 1 convite, tem ${list.length}`);
  assert(list[0].sharer_email === aliceEmail, 'remetente errado');
  assert(list[0].task_title === 'Planejar TCC', 'título da tarefa errado');
  assert(list[0].status === 'pending', 'status deveria ser pending');
  // eslint-disable-next-line no-console
  console.log('✅ Bob vê convite pendente com dados corretos');

  // Bob aceita
  const shareId = list[0].id as string;
  const accept = await req('POST', `/shares/${shareId}/accept`, bob);
  assert(accept.status === 200, `aceitar falhou: ${accept.status}`);
  const incoming2 = await req('GET', '/shares/incoming', bob);
  assert(((incoming2.json as Json).incoming as Json[])[0].status === 'accepted', 'status deveria ser accepted');
  // eslint-disable-next-line no-console
  console.log('✅ Bob aceitou (status=accepted)');

  // Alice (não-destinatária) não consegue aceitar convite de Bob
  const stealAccept = await req('POST', `/shares/${shareId}/accept`, alice);
  assert(stealAccept.status === 404, `não-destinatário deveria receber 404, recebeu ${stealAccept.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ só o destinatário aceita (404 p/ outro)');

  // ── Link público ──
  const linkRes = await req('POST', '/share-links', alice, { taskId, expiresInDays: 7 });
  assert(linkRes.status === 201, `criar link falhou: ${linkRes.status}`);
  const link = (linkRes.json as Json).link as Json;
  const token = link.token as string;
  // eslint-disable-next-line no-console
  console.log('✅ link público gerado');

  // acesso público SEM auth
  const pub1 = await req('GET', `/public/shared/${token}`);
  assert(pub1.status === 200, `acesso público falhou: ${pub1.status}`);
  const pubTask = (pub1.json as Json).task as Json;
  assert(pubTask.title === 'Planejar TCC', 'título público errado');
  assert(pubTask.shared_by_email === aliceEmail, 'dono no link errado');
  assert(pubTask.view_count === 1, `view_count deveria ser 1, veio ${pubTask.view_count}`);
  // eslint-disable-next-line no-console
  console.log('✅ acesso público sem login OK (view_count=1)');

  // segundo acesso incrementa o contador
  const pub2 = await req('GET', `/public/shared/${token}`);
  assert(((pub2.json as Json).task as Json).view_count === 2, 'contador não incrementou');
  // eslint-disable-next-line no-console
  console.log('✅ contador de visualizações incrementa (2)');

  // listar links da tarefa (Alice)
  const links = await req('GET', `/share-links?taskId=${taskId}`, alice);
  assert(((links.json as Json).links as unknown[]).length === 1, 'Alice deveria ver 1 link');
  // eslint-disable-next-line no-console
  console.log('✅ Alice lista seus links');

  // revogar
  const revoke = await req('POST', `/share-links/${link.id}/revoke`, alice);
  assert(revoke.status === 200, `revogar falhou: ${revoke.status}`);
  const pub3 = await req('GET', `/public/shared/${token}`);
  assert(pub3.status === 404, `link revogado deveria dar 404, deu ${pub3.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ link revogado → 404');

  // eslint-disable-next-line no-console
  console.log('\n🎉 Todos os smokes de compartilhamento passaram.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Smoke falhou:', err instanceof Error ? err.message : err);
  process.exit(1);
});
