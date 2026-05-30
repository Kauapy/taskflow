/**
 * Smoke test manual de upload (Fase E).
 *   npm run smoke:uploads
 *
 * Cobre: upload de arquivo, download público da URL retornada, anexar a
 * uma tarefa, rejeição de arquivo > 10 MB, e exclusão.
 * Roda contra o driver ativo (disk em dev).
 */
export {};

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000';

interface Json { [k: string]: unknown }

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const email = `upload-${Date.now()}@example.com`;
  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'senhaSegura123' }),
  });
  const token = ((await signupRes.json()) as Json).token as string;
  assert(!!token, 'signup falhou');
  // eslint-disable-next-line no-console
  console.log('✅ usuário criado');

  // 1. upload de um arquivo de texto
  const content = 'Conteúdo do anexo de teste do TCC.\nLinha 2.';
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), 'anotacoes.txt');

  const upRes = await fetch(`${BASE}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const upBody = await upRes.text();
  assert(upRes.status === 201, `upload falhou: ${upRes.status} ${upBody}`);
  const attachment = (JSON.parse(upBody) as Json).attachment as Json;
  assert(typeof attachment.url === 'string', 'url ausente');
  assert(attachment.name === 'anotacoes.txt', 'nome errado');
  // eslint-disable-next-line no-console
  console.log(`✅ upload OK — ${attachment.url}`);

  // 2. baixar a URL pública (sem auth) e conferir o conteúdo
  const dlRes = await fetch(attachment.url as string);
  assert(dlRes.status === 200, `download falhou: ${dlRes.status}`);
  const dl = await dlRes.text();
  assert(dl === content, 'conteúdo baixado difere do enviado');
  // eslint-disable-next-line no-console
  console.log('✅ download público OK (conteúdo confere)');

  // 3. anexar a URL a uma tarefa
  const taskRes = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Tarefa com anexo', attachments: [attachment.url] }),
  });
  assert(taskRes.status === 201, `criar tarefa com anexo falhou: ${taskRes.status}`);
  const task = ((await taskRes.json()) as Json).task as Json;
  assert((task.attachments as string[]).length === 1, 'anexo não persistiu na tarefa');
  // eslint-disable-next-line no-console
  console.log('✅ anexo persistido na tarefa');

  // 4. arquivo > 10 MB deve dar 400
  const big = new Uint8Array(10 * 1024 * 1024 + 1024); // 10MB + 1KB
  const bigForm = new FormData();
  bigForm.append('file', new Blob([big]), 'grande.bin');
  const bigRes = await fetch(`${BASE}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: bigForm,
  });
  assert(bigRes.status === 400, `arquivo grande deveria dar 400, deu ${bigRes.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ arquivo > 10 MB rejeitado (400)');

  // 5. excluir o anexo
  const delRes = await fetch(`${BASE}/uploads`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key: attachment.key }),
  });
  assert(delRes.status === 204, `exclusão falhou: ${delRes.status}`);
  const gone = await fetch(attachment.url as string);
  assert(gone.status === 404, `após exclusão a URL deveria dar 404, deu ${gone.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ exclusão OK (URL agora 404)');

  // eslint-disable-next-line no-console
  console.log('\n🎉 Todos os smokes de upload passaram.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Smoke falhou:', err instanceof Error ? err.message : err);
  process.exit(1);
});
