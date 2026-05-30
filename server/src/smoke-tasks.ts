/**
 * Smoke test manual de tarefas + progresso (Fase C).
 *
 * Pré: docker/postgres no ar, migrations aplicadas, servidor em dev.
 *   npm run smoke:tasks
 *
 * Fluxo: cria usuário → cria 2 tarefas → confere progresso (+20 XP, 2 criadas)
 *        → conclui 1 → confere (+50 XP, 1 concluída, streak 1) → edita → deleta.
 */
export {}; // torna este arquivo um módulo (escopo isolado)

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
  const json = text ? JSON.parse(text) : null;
  return { status: res.status, json };
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const email = `tasks-${Date.now()}@example.com`;
  const password = 'senhaSegura123';

  // signup
  const signup = await req('POST', '/auth/signup', undefined, { email, password });
  assert(signup.status === 201, `signup falhou: ${signup.status}`);
  const token = (signup.json as Json).token as string;
  // eslint-disable-next-line no-console
  console.log('✅ usuário criado');

  // progresso inicial (cria a linha)
  const p0 = await req('GET', '/progress', token);
  assert(p0.status === 200, `GET /progress falhou: ${p0.status}`);
  const prog0 = (p0.json as Json).progress as Json;
  assert(prog0.experience_points === 0, 'XP inicial deveria ser 0');
  // eslint-disable-next-line no-console
  console.log('✅ progresso inicial zerado');

  // cria 2 tarefas (uma com localização)
  const t1 = await req('POST', '/tasks', token, {
    title: 'Estudar para a prova', urgency: 'alta', location: 'Casa',
  });
  assert(t1.status === 201, `POST /tasks falhou: ${t1.status} ${JSON.stringify(t1.json)}`);
  const task1 = (t1.json as Json).task as Json;

  const t2 = await req('POST', '/tasks', token, {
    title: 'Comprar pão', urgency: 'baixa', location: 'Mercado',
  });
  assert(t2.status === 201, `POST /tasks #2 falhou: ${t2.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ 2 tarefas criadas');

  // lista
  const list = await req('GET', '/tasks', token);
  assert(list.status === 200, 'GET /tasks falhou');
  const tasks = (list.json as Json).tasks as unknown[];
  assert(tasks.length === 2, `esperava 2 tarefas, veio ${tasks.length}`);
  // eslint-disable-next-line no-console
  console.log('✅ listagem retornou 2 tarefas');

  // progresso após criar: +20 XP, 2 criadas, 2 localizações
  const p1 = await req('GET', '/progress', token);
  const prog1 = (p1.json as Json).progress as Json;
  assert(prog1.experience_points === 20, `XP após 2 criações deveria ser 20, veio ${prog1.experience_points}`);
  assert(prog1.total_tasks_created === 2, 'total_tasks_created deveria ser 2');
  assert(prog1.total_locations === 2, `total_locations deveria ser 2, veio ${prog1.total_locations}`);
  // eslint-disable-next-line no-console
  console.log('✅ progresso após criar: +20 XP, 2 criadas, 2 locais');

  // conclui a tarefa 1
  const complete = await req('POST', `/tasks/${task1.id}/complete`, token);
  assert(complete.status === 200, `complete falhou: ${complete.status} ${JSON.stringify(complete.json)}`);
  // eslint-disable-next-line no-console
  console.log('✅ tarefa concluída');

  // concluir de novo deve dar 409
  const dupComplete = await req('POST', `/tasks/${task1.id}/complete`, token);
  assert(dupComplete.status === 409, `concluir duas vezes deveria dar 409, deu ${dupComplete.status}`);
  // eslint-disable-next-line no-console
  console.log('✅ dupla conclusão bloqueada (409)');

  // progresso após concluir: +50 (total 70), 1 concluída, streak 1
  const p2 = await req('GET', '/progress', token);
  const prog2 = (p2.json as Json).progress as Json;
  assert(prog2.experience_points === 70, `XP deveria ser 70, veio ${prog2.experience_points}`);
  assert(prog2.total_tasks_completed === 1, 'total_tasks_completed deveria ser 1');
  assert(prog2.current_streak === 1, `current_streak deveria ser 1, veio ${prog2.current_streak}`);
  // eslint-disable-next-line no-console
  console.log('✅ progresso após concluir: 70 XP, 1 concluída, streak 1');

  // edita a tarefa 2
  const t2id = ((list.json as Json).tasks as Json[]).find(t => t.title === 'Comprar pão')!.id;
  const patch = await req('PATCH', `/tasks/${t2id}`, token, { title: 'Comprar pão integral', urgency: 'media' });
  assert(patch.status === 200, `PATCH falhou: ${patch.status}`);
  assert(((patch.json as Json).task as Json).title === 'Comprar pão integral', 'título não atualizou');
  // eslint-disable-next-line no-console
  console.log('✅ edição funcionou');

  // isolamento: outro usuário não vê/edita a tarefa
  const other = await req('POST', '/auth/signup', undefined, {
    email: `other-${Date.now()}@example.com`, password,
  });
  const otherToken = (other.json as Json).token as string;
  const steal = await req('PATCH', `/tasks/${t2id}`, otherToken, { title: 'hackeado' });
  assert(steal.status === 404, `outro usuário deveria receber 404, recebeu ${steal.status}`);
  const otherList = await req('GET', '/tasks', otherToken);
  assert(((otherList.json as Json).tasks as unknown[]).length === 0, 'outro usuário não deveria ver tarefas alheias');
  // eslint-disable-next-line no-console
  console.log('✅ isolamento entre usuários OK (404 + lista vazia)');

  // deleta
  const del = await req('DELETE', `/tasks/${t2id}`, token);
  assert(del.status === 204, `DELETE falhou: ${del.status}`);
  const listAfter = await req('GET', '/tasks', token);
  assert(((listAfter.json as Json).tasks as unknown[]).length === 1, 'deveria sobrar 1 tarefa');
  // eslint-disable-next-line no-console
  console.log('✅ exclusão funcionou');

  // eslint-disable-next-line no-console
  console.log('\n🎉 Todos os smokes de tarefas+progresso passaram.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Smoke falhou:', err instanceof Error ? err.message : err);
  process.exit(1);
});
