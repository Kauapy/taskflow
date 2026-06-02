# Taskflow

Gerenciador de tarefas pessoais com **gamificação** (XP, níveis, sequências/streaks e missões) e **dashboard analítico**, construído como Trabalho de Conclusão de Curso (TCC).

> Arquitetura: **SPA React** (frontend) + **API REST Node/Express** (backend) + **PostgreSQL**.
> O projeto originalmente usava Supabase (BaaS) e foi migrado para um backend próprio.

## Sumário

- [Visão geral](#visão-geral)
- [Documentação](#documentação)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Setup do banco de dados (PostgreSQL)](#setup-do-banco-de-dados-postgresql)
- [Setup do backend](#setup-do-backend)
- [Setup do frontend](#setup-do-frontend)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Banco de dados](#banco-de-dados)
- [Funcionalidades](#funcionalidades)
- [Testes](#testes)
- [Limitações conhecidas](#limitações-conhecidas)

## Documentação

| Documento | O que é |
| --------- | ------- |
| [docs/PROBLEMA.md](docs/PROBLEMA.md) | Problema, justificativa, público-alvo, objetivos, diferenciais |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Visão geral, fluxos, autorização, decisões (diagramas Mermaid) |
| [docs/ERD.md](docs/ERD.md) | Diagrama Entidade-Relacionamento e schema atual |
| [docs/MANUAL.md](docs/MANUAL.md) | Manual do usuário final |
| [RELATORIO_TCC.md](RELATORIO_TCC.md) | Relatório técnico consolidado |

## Visão geral

O Taskflow transforma a gestão de tarefas em uma experiência mais engajadora, aplicando gamificação (XP por ação, níveis, sequências diárias e missões progressivas) sobre um CRUD tradicional, somado a um painel de análises de produtividade.

**Público-alvo:** estudantes e jovens profissionais que querem manter rotinas e visualizar a própria evolução.

## Tecnologias

**Frontend**
- React 18, TypeScript 5, Vite 5
- styled-components 6 (tema claro/escuro próprio)
- lucide-react (ícones), recharts (gráficos)

**Backend**
- Node + Express 4 + TypeScript
- PostgreSQL (driver `pg`, queries parametrizadas)
- Autenticação própria: bcrypt (hash de senha) + JWT (sessão stateless)
- multer (upload) + `@aws-sdk/client-s3` (storage S3-compatível opcional)
- zod (validação de payloads)

**Qualidade**
- ESLint 9, Vitest (frontend) + smoke tests (backend), GitHub Actions

## Estrutura do projeto

```
.
├── src/                      # Frontend (SPA React)
│   ├── components/           # Login, Dashboard, Sidebar, TopBar, TaskList,
│   │                         # AddTask, Missions, Analytics, OnboardingPanel,
│   │                         # ShareTaskDialog, SharedTasks, SharedTaskViewer…
│   ├── contexts/             # AuthContext, ThemeContext
│   ├── hooks/                # useAuth, useTheme, useTasks, useProgress,
│   │                         # useAnalytics, useShares
│   ├── lib/                  # api.ts (cliente HTTP), types.ts, storage.ts,
│   │                         # streak.ts, analytics.ts, onboarding.ts
│   └── styles/               # theme + GlobalStyles
│
├── server/                   # Backend (API REST)
│   └── src/
│       ├── routes/           # auth, tasks, progress, shares, public, uploads, health
│       ├── middleware/       # requireAuth, error handler
│       ├── lib/              # hash (bcrypt), jwt, progress, streak, storage/
│       ├── config.ts         # validação de env (zod)
│       ├── db.ts             # pool Postgres + helpers (query, transação)
│       ├── migrate.ts        # runner de migrations idempotente
│       └── index.ts          # bootstrap do Express
│
├── db/migrations/            # SQL versionado (0001_auth, 0002_tasks_progress, 0003_shares)
├── docs/                     # PROBLEMA, ARQUITETURA, ERD, MANUAL
└── .github/workflows/        # CI (typecheck + lint + test + build)
```

## Pré-requisitos

- Node.js 18+ e npm 9+
- PostgreSQL 14+ acessível (local ou em nuvem). Qualquer uma das opções:
  - **Docker:** `docker run --name taskflow-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=taskflow -p 5432:5432 -d postgres:16-alpine` (exige virtualização/WSL2 no Windows)
  - **Postgres nativo** instalado na máquina
  - **Postgres portátil** (binários em zip da EnterpriseDB) — não exige admin nem virtualização
  - **Postgres gerenciado** (Neon, Railway, Supabase-como-DB) — basta a connection string

## Setup do banco de dados (PostgreSQL)

1. Tenha um Postgres rodando e um banco `taskflow` criado:
   ```sql
   CREATE DATABASE taskflow;
   ```
2. Configure a `DATABASE_URL` no `server/.env` (ver [Variáveis de ambiente](#variáveis-de-ambiente)).
3. Rode as migrations (cria todas as tabelas e índices):
   ```bash
   cd server
   npm install
   npm run migrate
   ```
   O runner é idempotente — registra o que já foi aplicado em `_migrations` e não repete.

> **Não há seeds.** O primeiro usuário é criado pelo próprio fluxo de cadastro do app; o registro de progresso é criado automaticamente no signup / primeiro acesso.

## Setup do backend

```bash
cd server
npm install
cp .env.example .env        # ajuste DATABASE_URL e JWT_SECRET
npm run migrate             # cria as tabelas
npm run dev                 # sobe a API em http://localhost:4000
```

Verifique a saúde: `curl http://localhost:4000/health` → `{"status":"ok","db":"ok",...}`.

## Setup do frontend

```bash
# na raiz do projeto
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:4000 (default já serve)
npm run dev                 # abre em http://localhost:5173
```

Abra `http://localhost:5173`, **crie uma conta** e use o app.

## Variáveis de ambiente

**Frontend (`.env` na raiz)**

| Variável        | Descrição                              | Default                  |
| --------------- | -------------------------------------- | ------------------------ |
| `VITE_API_URL`  | URL base do backend                    | `http://localhost:4000`  |

**Backend (`server/.env`)**

| Variável            | Descrição                                                | Exemplo                                            |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `PORT`              | Porta da API                                             | `4000`                                             |
| `DATABASE_URL`      | Connection string do Postgres                            | `postgres://postgres:postgres@localhost:5432/taskflow` |
| `FRONTEND_ORIGIN`   | Origem permitida no CORS (produção)                      | `http://localhost:5173`                            |
| `JWT_SECRET`        | Segredo do JWT (≥16 chars; use `openssl rand -base64 32`)| `troque-este-segredo…`                             |
| `JWT_EXPIRES_IN`    | Validade do token                                        | `7d`                                               |
| `BCRYPT_ROUNDS`     | Custo do bcrypt                                          | `10`                                               |
| `STORAGE_DRIVER`    | `disk` (dev) ou `s3` (produção)                          | `disk`                                             |
| `STORAGE_DISK_DIR`  | Pasta dos uploads quando `disk`                          | `./uploads`                                        |
| `STORAGE_PUBLIC_URL`| Base pública dos arquivos (obrigatória quando `s3`)      | `https://pub-xxxx.r2.dev`                          |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Credenciais S3-compatível (R2/AWS/B2) quando `s3` | — |

> Em dev, o CORS aceita qualquer `localhost`/`127.0.0.1` automaticamente (o Vite pode cair em 5174 se a 5173 estiver ocupada).

## Scripts disponíveis

**Frontend (raiz)**

| Comando             | O que faz                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Vite em modo dev (HMR)             |
| `npm run build`     | Build de produção                  |
| `npm run preview`   | Pré-visualiza o build              |
| `npm run lint`      | ESLint                             |
| `npm run typecheck` | `tsc --noEmit`                     |
| `npm run test`      | Vitest (watch)                     |
| `npm run test:run`  | Vitest (uma vez, modo CI)          |

**Backend (`server/`)**

| Comando                | O que faz                                         |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | API com reload (tsx watch)                        |
| `npm run build`        | Compila TypeScript para `dist/`                   |
| `npm start`            | Roda o build (`node dist/index.js`)               |
| `npm run migrate`      | Aplica as migrations pendentes                    |
| `npm run typecheck`    | `tsc --noEmit`                                    |
| `npm run smoke`        | Smoke test de autenticação (servidor no ar)       |
| `npm run smoke:tasks`  | Smoke test de tarefas + progresso                 |
| `npm run smoke:shares` | Smoke test de compartilhamento                    |
| `npm run smoke:uploads`| Smoke test de upload                              |
| `npm run smoke:security`| Bateria de testes de segurança                   |

## Banco de dados

| Tabela             | Conteúdo |
| ------------------ | -------- |
| `auth_users`       | Credenciais (e-mail + hash bcrypt). Substitui o `auth.users` do Supabase. |
| `profiles`         | Espelho público de e-mail (lookup de compartilhamento). |
| `tasks`            | Tarefas: título, urgência, localização, categoria, vencimento, anexos (URLs), `shared_with`. |
| `user_progress`    | XP, nível, streaks, locais, tarefas criadas/completadas. |
| `task_shares`      | Convites de compartilhamento por e-mail (`pending`/`accepted`/`declined`). |
| `task_share_links` | Links públicos com token, validade opcional, contador de views. |

**Autorização:** não há RLS no banco. Cada query do backend filtra por `user_id = <usuário autenticado>` (derivado do JWT), garantindo o isolamento entre usuários. Detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Funcionalidades

- 🔐 Cadastro e login (e-mail/senha) com bcrypt + JWT
- ✅ CRUD de tarefas: urgência, localização, categoria, vencimento, anexos
- 🎮 Gamificação: XP, nível, streak diário e **missões progressivas em cadeia**
- 📊 Dashboard analítico (produtividade semanal/mensal, tempo médio)
- 🤝 Compartilhamento por **e-mail** (aceitar/recusar) ou **link público** (sem cadastro)
- 📎 Upload de qualquer arquivo (até 10 MB)
- 🌗 Tema claro/escuro + aumento de fonte (acessibilidade)

## Testes

- **Frontend:** Vitest + Testing Library — `npm run test:run` (44 testes: lógica pura de streak/analytics/onboarding + componentes).
- **Backend:** smoke tests executáveis contra a API viva — funcionais (`smoke`, `smoke:tasks`, `smoke:shares`, `smoke:uploads`) e de segurança (`smoke:security`).
- **CI:** `.github/workflows/ci.yml` roda typecheck + lint + test + build a cada push/PR.

### Checklist de teste manual
1. Cadastrar conta → login → logout.
2. Criar tarefa (com/sem data, categoria, anexo) → ver XP +10.
3. Concluir tarefa → XP +50, streak = 1.
4. Editar e excluir tarefa (modal de confirmação).
5. Compartilhar por e-mail (2ª conta) → aceitar/recusar.
6. Gerar link público → abrir em aba anônima (sem login) → revogar → 404.
7. Trocar tema e tamanho de fonte → recarregar (persistência).
8. Conferir Análises e Missões.

## Limitações conhecidas

- Tarefas compartilhadas são **somente-leitura** para o destinatário.
- Progresso em tempo real usa **polling** (5s), não WebSocket.
- Sem reset de senha pela UI.
- Não há seeds — dados são criados pelo uso.
