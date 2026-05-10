# Relatório Técnico — Taskflow

> Documento que consolida a análise inicial, o trabalho realizado e o estado atual do projeto.
> Última atualização: 2026-05-09.

## 1. Resumo do projeto

**Taskflow** é uma aplicação web responsiva de gerenciamento de tarefas pessoais com **gamificação** (XP, níveis, sequências de dias e missões) e **dashboard analítico**. Backend serverless via **Supabase** (Auth + PostgreSQL com RLS + Realtime). Frontend SPA em **React + TypeScript + Vite**, com **styled-components** e **recharts**.

**Estágio atual:** **MVP funcional** com cobertura de testes, CI e documentação acadêmica. Apto para apresentação em banca.

## 2. Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript 5.5, Vite 5 |
| Estilização | styled-components 6 (tema dinâmico claro/escuro) |
| Ícones | lucide-react |
| Gráficos | recharts 3 |
| Backend (BaaS) | Supabase (Auth, Postgres com RLS, Realtime) |
| Testes | Vitest 4, Testing Library, jest-dom, jsdom |
| Lint/Type | ESLint 9, typescript-eslint 8 |
| CI | GitHub Actions |

## 3. Funcionalidades entregues

- 🔐 **Autenticação** por e-mail/senha (Supabase Auth).
- ✅ **CRUD completo** de tarefas com urgência, localização, categoria, data de vencimento, anexos (URLs), busca em tempo real e contagem regressiva ao vivo.
- 🎮 **Gamificação** com XP por ação (+10 criar, +50 completar), nível (`floor(xp/500)+1`), sequência de dias consecutivos com lógica determinística (mesmo dia / ontem / gap), e **14 missões** com progresso visual.
- 📊 **Dashboard analítico** com 4 KPIs no topo, gráfico de barras semanal (8 semanas) e gráfico de linha mensal (6 meses).
- 🤝 **Compartilhamento** de tarefas por e-mail entre usuários, com fluxo aceitar/recusar e RLS para tornar a tarefa visível ao destinatário.
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

- Tarefas compartilhadas são **read-only** para o destinatário. Co-edição exigiria policy UPDATE adicional + resolução de conflitos.
- Sem sincronização offline ou PWA.
- Anexos são apenas **links** (sem upload de arquivos para Supabase Storage).
- Sem reset de senha pela UI (Supabase Auth oferece via API; UI não exposta).
- Sem notificação push/e-mail quando alguém compartilha (poderia usar Realtime).
- 6 vulnerabilidades em dev-deps do Vite (correção requer upgrade major; PR separado).

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
- Upload de arquivos como anexos via Supabase Storage.
- Notificação Realtime quando alguém compartilha uma tarefa.
- Co-edição de tarefas compartilhadas.
- Reset de senha pela UI.
- App mobile nativo (React Native compartilhando hooks).
- Internacionalização (i18n) — hoje é só pt-BR.

## 9. Próximos passos sugeridos antes da apresentação

1. **Aplicar todas as migrations** num projeto Supabase fresco e validar que tudo roda.
2. **Capturar screenshots** e plugar em `docs/MANUAL.md` (placeholders já marcados).
3. **Rodar o checklist manual** do README inteiro pelo menos uma vez.
4. **Hospedar uma demo** em Vercel/Netlify para a banca poder testar.
5. **Preparar slides** com os diagramas Mermaid renderizados (qualquer editor Markdown moderno renderiza).
6. (Opcional) **Implementar a spec Playwright** sugerida — meia hora de trabalho a mais e elimina a única lacuna restante.

## 10. Histórico desta revisão

```
1100aaf  Fase 4: testes automatizados (Vitest + RTL) + CI no GitHub Actions
0538af1  Fase 3: implementar compartilhamento de tarefas (UI completa)
da17caf  Fase 2: melhorias de qualidade, acessibilidade e performance
bff27f1  Fase 1: correções obrigatórias para qualidade técnica do TCC
34727b5  Funcionalidade: implementar interface de painel de controle e contexto de gerenciamento de temas (estado pré-revisão)
```
