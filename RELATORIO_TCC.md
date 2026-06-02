# Relatório Técnico — Taskflow

> Documento que consolida a análise inicial, o trabalho realizado e o estado atual do projeto.
> Última atualização: 2026-06-01.

## 1. Resumo do projeto

**Taskflow** é uma aplicação web responsiva de gerenciamento de tarefas pessoais com **gamificação** (XP, níveis, sequências de dias e missões progressivas) e **dashboard analítico**.

**Arquitetura atual:** SPA em **React + TypeScript + Vite** (frontend) consumindo uma **API REST própria em Node + Express + TypeScript** (backend), com **PostgreSQL** como banco. O projeto começou sobre **Supabase (BaaS)** e foi **migrado para um backend próprio** (auth com bcrypt+JWT, autorização na aplicação, storage em disco/S3, polling no lugar de Realtime).

**Estágio atual:** **MVP funcional** com cobertura de testes, testes de segurança, CI e documentação. Apto para apresentação em banca.

## 2. Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript 5.5, Vite 5 |
| Estilização | styled-components 6 (tema claro/escuro; filtro de props via @emotion/is-prop-valid) |
| Ícones / Gráficos | lucide-react / recharts 3 |
| Backend | Node + Express 4 + TypeScript |
| Banco | PostgreSQL (driver `pg`, queries parametrizadas) |
| Auth | bcrypt (hash de senha) + JWT (sessão stateless) |
| Upload/Storage | multer + driver disk / S3-compatível (`@aws-sdk/client-s3`) |
| Validação | zod |
| Testes | Vitest + Testing Library (front); smoke tests funcionais e de segurança (back) |
| Lint/Type/CI | ESLint 9, typescript-eslint 8, GitHub Actions |

## 2.1. Migração de BaaS (Supabase) para backend próprio

O projeto nasceu usando **Supabase** como backend pronto. Por decisão de TCC (controle total, evitar pausa de free tier e demonstrar competências de backend/SQL/segurança), toda a camada foi reescrita como um **servidor Node/Express + PostgreSQL** próprio, em fases pequenas e testadas.

| Recurso | Antes (Supabase) | Depois (backend próprio) |
|---|---|---|
| Autenticação | Supabase Auth | tabela `auth_users` + bcrypt + JWT (`/auth/signup`, `/auth/login`, `/auth/me`) |
| Isolamento de dados | Row Level Security (RLS) | filtro `WHERE user_id = <JWT>` em cada query |
| Lógica no banco | RPCs `SECURITY DEFINER` | endpoints REST (`/shares`, `/public/shared/:token`, …) |
| Tempo real | Supabase Realtime (WebSocket) | polling de `GET /progress` (5s) |
| Arquivos | Supabase Storage | driver `disk` (dev) / `s3` (R2/AWS/B2) via `/uploads` |
| Cliente | `@supabase/supabase-js` | `src/lib/api.ts` (fetch + JWT) |
| Schema | migrations Supabase | `db/migrations/` aplicadas por runner idempotente |

**Ganhos medidos:** bundle inicial do frontend caiu de ~489 kB para ~292 kB (−40%, removendo o SDK). Backend com **0 vulnerabilidades** no `npm audit`. Bateria de **10 testes de segurança** automatizados cobrindo auth, isolamento, SQL injection, XSS, path traversal e enumeração de e-mail — todos passando.

**Limitação herdada da migração:** contas criadas no Supabase **não** foram migradas (o hash de senha é interno do Supabase); usuários recadastram no novo backend.

## 3. Funcionalidades entregues

- 🔐 **Autenticação** por e-mail/senha com bcrypt + JWT (backend próprio).
- ✅ **CRUD completo** de tarefas com urgência, localização, categoria, data de vencimento, anexos, busca em tempo real e contagem regressiva ao vivo.
- 🎮 **Gamificação** com XP por ação (+10 criar, +50 completar), nível (`floor(xp/500)+1`), sequência de dias consecutivos com lógica determinística (mesmo dia / ontem / gap), e **missões progressivas em cadeia** (ao bater o alvo, a próxima missão entra no lugar).
- 📊 **Dashboard analítico** com 4 KPIs no topo, gráfico de barras semanal (8 semanas) e gráfico de linha mensal (6 meses).
- 🤝 **Compartilhamento** por e-mail (aceitar/recusar) ou por **link público** (sem cadastro); visibilidade controlada pela autorização do backend.
- 📎 **Upload de arquivos** (qualquer tipo, até 10 MB) via backend (driver disk/S3).
- 🌗 **Tema claro/escuro** com persistência em `localStorage`.
- 🔠 **Aumento de fonte** (acessibilidade) com 3 níveis e persistência.
- ♿ **Acessibilidade** com `aria-label` em todos os botões só de ícone, navegação por teclado, foco visível, modal com `role="dialog"` + `aria-modal` + Esc.

## 4. Comandos e métricas

| Comando | Resultado |
|---|---|
| `npm install` | OK |
| `npm run typecheck` | **0 erros** |
| `npm run lint` | **0 erros, 0 warnings** |
| `npm run test:run` | **26/26 testes passando** (em 5 arquivos, ~7s) |
| `npm run build` | OK — bundle inicial **440 kB / 125 kB gzip**, Analytics chunk separado **379 kB / 112 kB gzip** |
| `npm audit` | 6 vulnerabilidades em dev-deps do Vite (não-críticas; correção exige major-bump) |

## 5. Trabalho realizado nesta revisão (5 fases)

### Fase 1 — Correções obrigatórias

**Commit:** `bff27f1`. Resolveu bugs que tornavam o app pouco confiável.

| Bug original | Status |
|---|---|
| `addTask` descartava silenciosamente category/due_date/attachments | ✅ Persistidos |
| `theme.colors.error` (não existia, deveria ser `danger`) | ✅ Trocado |
| `Task` não importado em `Dashboard.tsx` | ✅ Importado |
| `(task as any)` em vários pontos de TaskList | ✅ Removidos |
| Streak nunca atualizava (lógica ausente) | ✅ Implementada |
| `total_locations` recalculado só em add | ✅ Recalculado em update/delete |
| Falta de `.env.example` e README | ✅ Criados |

### Fase 2 — Qualidade, acessibilidade e performance

**Commit:** `da17caf`.

- `aria-label` em **11 botões** só de ícone.
- Modal de confirmação real ([ConfirmDialog.tsx](src/components/ConfirmDialog.tsx)) substituindo o frágil "clica de novo em 3s".
- Spinner durante o loading de auth (em vez de tela branca).
- Lazy-load de Analytics → bundle inicial caiu de **802 kB → 426 kB** (gzip 234 → 123 kB).
- Tailwind morto removido (era declarado mas nunca importado).
- Validações: título ≤ 200, localização ≤ 100, anexos restritos a `http(s)`.
- `style.zoom` sem `as any`.
- `useCallback` nos fetchers (eliminou warnings exhaustive-deps).
- `npm audit fix` não-breaking: **17 → 6 vulnerabilidades**.

### Fase 3 — Implementar compartilhamento

**Commit:** `0538af1`.

A funcionalidade estava modelada no banco mas a UI não existia. Entregue:

- Nova migration `20260509120000_add_profiles_and_sharing.sql`: tabela `profiles`, trigger + backfill, RPCs `find_user_id_by_email` e `get_incoming_shares` (ambas `SECURITY DEFINER`), nova RLS de SELECT em `tasks` para destinatários, políticas DELETE em `task_shares`.
- [useShares.ts](src/hooks/useShares.ts) + [ShareTaskDialog.tsx](src/components/ShareTaskDialog.tsx) + [SharedTasks.tsx](src/components/SharedTasks.tsx).
- Botão Share por tarefa.
- Nova aba "Compartilhadas" no Dashboard.
- Bundle inicial: 426 kB → **440 kB** (+14 kB minified / +2.7 kB gzip — feature inteira em <3 kB).

### Fase 4 — Testes automatizados + CI

**Commit:** `1100aaf`.

- Setup completo: Vitest + Testing Library + jest-dom + jsdom.
- Refactor: lógica pura extraída para [src/lib/streak.ts](src/lib/streak.ts) e [src/lib/analytics.ts](src/lib/analytics.ts).
- **26 testes** distribuídos em 5 arquivos: streak (6), analytics (7), ConfirmDialog (5), AddTask (4), Missions (4).
- [.github/workflows/ci.yml](.github/workflows/ci.yml) executa typecheck + lint + test + build em cada push/PR.
- README ganhou **checklist completo de teste manual** + esqueleto de spec Playwright para E2E.

### Fase 5 — Documentação acadêmica

- [docs/PROBLEMA.md](docs/PROBLEMA.md) — problema, justificativa, público, objetivo geral, 9 objetivos específicos, diferenciais, limitações.
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — visão geral com Mermaid, fluxos sequenciais (auth, criar/completar, compartilhamento), políticas RLS detalhadas, decisões arquiteturais.
- [docs/ERD.md](docs/ERD.md) — diagrama Mermaid do banco, triggers, funções, índices, histórico de migrations.
- [docs/MANUAL.md](docs/MANUAL.md) — manual do usuário (15 seções) com pontos para inserção de screenshots.
- Bônus: `useAuth` e `useTheme` movidos para [src/hooks/](src/hooks/), eliminando os 2 warnings cosméticos de fast-refresh. Lint agora é **100% limpo**.

## 6. Limitações conhecidas (declaradas)

- Tarefas compartilhadas são **read-only** para o destinatário. Co-edição exigiria endpoint de update compartilhado + resolução de conflitos.
- Sem sincronização offline ou PWA.
- Progresso em tempo real usa **polling** (5s), não WebSocket.
- Sem reset de senha pela UI.
- Sem notificação push/e-mail quando alguém compartilha.
- Frontend: vulnerabilidades dev-only em deps do Vite (correção exige upgrade major). Backend: **0 vulnerabilidades**.

## 7. Riscos para apresentação — mitigados

| Risco da análise inicial | Status |
|---|---|
| Banca cria tarefa com data → vê que data não persiste | ✅ Resolvido na Fase 1 |
| Banca pede para mostrar streak crescendo → nunca cresce | ✅ Resolvido na Fase 1 |
| Banca pede para mostrar compartilhamento → não tem UI | ✅ Resolvido na Fase 3 |
| Banca roda lint/typecheck → 17 erros | ✅ Resolvido (0 erros, 0 warnings) |
| Banca pede testes automatizados | ✅ Resolvido (26 testes + CI) |
| Banca pede README/ERD | ✅ Resolvido (README completo + 4 docs em `docs/`) |

## 8. O que ainda pode ser feito (roadmap futuro)

- Testes E2E reais com **Playwright** (esqueleto sugerido no README).
- PWA / sincronização offline.
- Notificação (push/e-mail) quando alguém compartilha uma tarefa.
- Co-edição de tarefas compartilhadas.
- Reset de senha pela UI.
- App mobile nativo (React Native compartilhando hooks).
- Internacionalização (i18n) — hoje é só pt-BR.
- Atualizar o Vite (major) para zerar as vulns dev-only do frontend.

## 9. Próximos passos sugeridos antes da apresentação

1. **Subir o ambiente** (Postgres + `npm run migrate` no backend + backend + frontend) e validar o fluxo completo no navegador.
2. **Hospedar a demo:** backend em Railway/Render + Postgres gerenciado (Neon) + frontend em Vercel/Netlify, apontando `VITE_API_URL` para o backend publicado.
3. **Capturar screenshots** e plugar em `docs/MANUAL.md` (placeholders já marcados).
4. **Rodar o checklist manual** do README e os smokes do backend (`npm run smoke:*`).
5. **Preparar slides** com os diagramas Mermaid de `docs/ARQUITETURA.md` renderizados.
6. (Opcional) **Implementar a spec Playwright** sugerida para cobrir o golden path E2E.

## 10. Histórico desta revisão

```
1100aaf  Fase 4: testes automatizados (Vitest + RTL) + CI no GitHub Actions
0538af1  Fase 3: implementar compartilhamento de tarefas (UI completa)
da17caf  Fase 2: melhorias de qualidade, acessibilidade e performance
bff27f1  Fase 1: correções obrigatórias para qualidade técnica do TCC
34727b5  Funcionalidade: implementar interface de painel de controle e contexto de gerenciamento de temas (estado pré-revisão)
```
