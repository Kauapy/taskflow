/**
 * Smoke test manual dos endpoints de auth. NÃO é teste automatizado de CI —
 * é um script de conveniência para validar a Fase B contra um servidor rodando.
 *
 * Pré-requisitos:
 *   1. docker compose up -d        (Postgres no ar)
 *   2. npm run migrate             (cria auth_users + profiles)
 *   3. npm run dev                 (servidor em http://localhost:4000)
 *   4. Em outro terminal: npm run smoke
 *
 * Cria um usuário aleatório, faz login e chama /me. Sai com código !=0 se algo falhar.
 */
export {}; // torna este arquivo um módulo (escopo isolado)

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000';

interface AuthResponse {
  token?: string;
  user?: { id: string; email: string };
}

async function main(): Promise<void> {
  const email = `smoke-${Date.now()}@example.com`;
  const password = 'senhaSegura123';

  // 1. signup
  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const signup = (await signupRes.json()) as AuthResponse;
  if (!signupRes.ok || !signup.token) {
    throw new Error(`signup falhou (${signupRes.status}): ${JSON.stringify(signup)}`);
  }
  // eslint-disable-next-line no-console
  console.log(`✅ signup OK — user ${signup.user?.id}`);

  // 2. signup duplicado deve dar 409
  const dupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (dupRes.status !== 409) {
    throw new Error(`signup duplicado deveria dar 409, deu ${dupRes.status}`);
  }
  // eslint-disable-next-line no-console
  console.log('✅ signup duplicado bloqueado (409)');

  // 3. login
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = (await loginRes.json()) as AuthResponse;
  if (!loginRes.ok || !login.token) {
    throw new Error(`login falhou (${loginRes.status}): ${JSON.stringify(login)}`);
  }
  // eslint-disable-next-line no-console
  console.log('✅ login OK');

  // 4. login com senha errada deve dar 401
  const badRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'errada' }),
  });
  if (badRes.status !== 401) {
    throw new Error(`login com senha errada deveria dar 401, deu ${badRes.status}`);
  }
  // eslint-disable-next-line no-console
  console.log('✅ senha errada rejeitada (401)');

  // 5. /me com token
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${login.token}` },
  });
  const me = (await meRes.json()) as AuthResponse;
  if (!meRes.ok || me.user?.email !== email) {
    throw new Error(`/me falhou (${meRes.status}): ${JSON.stringify(me)}`);
  }
  // eslint-disable-next-line no-console
  console.log('✅ /me retornou o usuário correto');

  // 6. /me sem token deve dar 401
  const noTokenRes = await fetch(`${BASE}/auth/me`);
  if (noTokenRes.status !== 401) {
    throw new Error(`/me sem token deveria dar 401, deu ${noTokenRes.status}`);
  }
  // eslint-disable-next-line no-console
  console.log('✅ /me sem token bloqueado (401)');

  // eslint-disable-next-line no-console
  console.log('\n🎉 Todos os smokes de auth passaram.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Smoke falhou:', err instanceof Error ? err.message : err);
  process.exit(1);
});
