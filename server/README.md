# Taskflow Server

Backend Node + Express + PostgreSQL que substitui o Supabase no Taskflow.

> Status: Fase A do plano de migração (scaffolding). Auth/CRUD/Storage chegam nas Fases B–E.

## Stack

- **Runtime:** Node 20+ (testado com 20.x)
- **Linguagem:** TypeScript 5
- **Framework HTTP:** Express 4
- **Banco:** PostgreSQL 16, driver `pg`
- **Auth (vem na Fase B):** bcryptjs + jsonwebtoken
- **Upload (vem na Fase E):** multer (disco) + AWS SDK opcional (R2/S3)
- **Validação:** zod

## Como rodar em dev

### 1. Subir o Postgres (Docker)

Na **raiz do projeto** (uma pasta acima):

```bash
docker compose up -d
```

Isso sobe um Postgres em `localhost:5432` com user/pass `postgres/postgres` e banco `taskflow`. Dados persistem em um volume Docker; pra zerar tudo:
```bash
docker compose down -v
```

### 2. Instalar dependências

```bash
cd server
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Mínimo a editar: `JWT_SECRET` (qualquer string com ≥16 caracteres).

### 4. Aplicar migrations

```bash
npm run migrate
```

> Na Fase A ainda não há migrations em `db/migrations/`. O comando apenas confirma que conecta no banco. As migrations reais chegam na Fase H.

### 5. Subir o servidor

```bash
npm run dev
```

Servidor escuta em `http://localhost:4000`. Teste:

```bash
curl http://localhost:4000/health
# { "status": "ok", "db": "ok", "timestamp": "..." }
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia em modo dev com hot reload (tsx watch) |
| `npm run build` | Compila TS para `dist/` |
| `npm start` | Roda `dist/index.js` (após `build`) |
| `npm run migrate` | Aplica migrations pendentes |
| `npm run typecheck` | Só verifica tipos, sem emitir |

## Estrutura

```
server/
  src/
    index.ts          # Entry point Express
    config.ts         # Carregamento e validação de env
    db.ts             # Pool pg + helpers query/withTransaction
    migrate.ts        # Runner idempotente de migrations SQL
    routes/           # Endpoints HTTP (1 arquivo por recurso)
    middleware/       # Auth, error handler, etc.
    lib/              # Hashing, JWT, storage abstraction (Fases B+)
```

## Próximas fases

- **B:** Auth (signup, login, me, JWT)
- **C:** CRUD de tasks + atualização de progress/streak
- **D:** Shares por e-mail + link público
- **E:** Upload de arquivos (disco e R2)
- **F-I:** Frontend, migrations, docs

Cada fase é um commit isolado e testável.
