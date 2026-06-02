# Modelo de Dados (ERD)

## Diagrama

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "espelha"
  AUTH_USERS ||--|| USER_PROGRESS : "tem"
  AUTH_USERS ||--o{ TASKS : "possui"
  AUTH_USERS ||--o{ TASK_SHARES : "envia (shared_by)"
  AUTH_USERS ||--o{ TASK_SHARES : "recebe (shared_with)"
  AUTH_USERS ||--o{ TASK_SHARE_LINKS : "cria"
  TASKS ||--o{ TASK_SHARES : "é compartilhada em"
  TASKS ||--o{ TASK_SHARE_LINKS : "tem link público"

  AUTH_USERS {
    uuid id PK
    text email "unique"
    text password_hash "bcrypt"
    timestamptz created_at
  }

  PROFILES {
    uuid id PK_FK
    text email "lowercase, unique"
    timestamptz created_at
  }

  TASKS {
    uuid id PK
    uuid user_id FK
    text title "obrigatório, ≤200"
    text urgency "baixa | media | alta"
    text location "≤100"
    text category "Trabalho | Pessoal | ..."
    bool completed "default false"
    timestamptz completed_at
    timestamptz due_date
    text_array attachments "URLs http(s)"
    uuid_array shared_with "ids dos destinatários"
    timestamptz created_at
  }

  USER_PROGRESS {
    uuid id PK
    uuid user_id FK_UQ
    int total_tasks_created
    int total_tasks_completed
    int total_locations
    int current_streak
    int best_streak
    int level "floor(xp/500)+1"
    int experience_points
    timestamptz last_activity
    timestamptz updated_at
  }

  TASK_SHARES {
    uuid id PK
    uuid task_id FK
    uuid shared_by FK
    uuid shared_with FK
    text status "pending | accepted | declined"
    timestamptz created_at
  }

  TASK_SHARE_LINKS {
    uuid id PK
    uuid task_id FK
    text token "32 chars hex, unique"
    uuid created_by FK
    timestamptz expires_at "NULL = sem expiração"
    bool revoked "default false"
    int view_count "incrementa a cada acesso"
    timestamptz created_at
  }
```

## Notas de modelagem

- `auth_users` guarda credenciais (e-mail + **hash bcrypt**). Substitui o `auth.users` interno do Supabase; agora é uma tabela comum do schema `public`, gerenciada pelo backend.
- `profiles` é um **espelho público** de `auth_users` (apenas `id` + `email`), usado no lookup por e-mail ao compartilhar. É preenchido explicitamente no signup.
- `task_shares` tem `UNIQUE(task_id, shared_with)` impedindo o mesmo usuário receber a mesma tarefa duas vezes.
- `task_share_links` tem `token` UNIQUE gerado por `encode(gen_random_bytes(16), 'hex')` — entropia de 128 bits.
- Todas as FKs para `auth_users` usam `ON DELETE CASCADE`: deletar a conta apaga tarefas, progresso, profile, shares e links.

## Sem RLS, triggers ou RPCs

Diferente da versão Supabase, o schema atual **não tem** Row Level Security, triggers nem funções armazenadas. Tudo isso virou responsabilidade do backend:

| Antes (no banco, Supabase) | Agora (no backend) |
| -------------------------- | ------------------ |
| Trigger que criava `user_progress`/`profiles` no signup | `INSERT` explícito no `POST /auth/signup` + `ensureProgress()` |
| RPC `find_user_id_by_email` | `SELECT` em `profiles` dentro de `POST /shares` |
| RPC `get_incoming_shares` | `SELECT` com JOIN em `GET /shares/incoming` |
| RPC `get_shared_task_by_token` | `GET /public/shared/:token` |
| Políticas RLS por tabela | filtro `WHERE user_id = $autenticado` em cada query |

Isso mantém o banco simples e portável (qualquer PostgreSQL serve), com a lógica concentrada e testável na aplicação.

## Índices

```sql
CREATE INDEX auth_users_email_idx         ON auth_users(lower(email));
CREATE INDEX profiles_email_idx           ON profiles(email);
CREATE INDEX tasks_user_id_idx            ON tasks(user_id);
CREATE INDEX tasks_completed_idx          ON tasks(completed);
CREATE INDEX tasks_created_at_idx         ON tasks(created_at DESC);
CREATE INDEX user_progress_user_id_idx    ON user_progress(user_id);
CREATE INDEX task_shares_shared_with_idx  ON task_shares(shared_with);
CREATE INDEX task_shares_task_id_idx      ON task_shares(task_id);
CREATE INDEX task_share_links_token_idx   ON task_share_links(token);
CREATE INDEX task_share_links_task_id_idx ON task_share_links(task_id);
```

## Migrations (db/migrations/)

Aplicadas em ordem pelo runner idempotente `server/src/migrate.ts`.

| Arquivo                    | Cria                                                          |
| -------------------------- | ------------------------------------------------------------- |
| `0001_auth.sql`            | `auth_users`, `profiles` (+ extensão `pgcrypto`)              |
| `0002_tasks_progress.sql`  | `tasks` (todas as colunas), `user_progress` + índices         |
| `0003_shares.sql`          | `task_shares`, `task_share_links` + índices                   |
