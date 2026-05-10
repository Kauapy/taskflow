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
    text email
    text encrypted_password
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

- `auth.users` é gerenciada pelo **Supabase Auth** (schema `auth`). O app só lê via `auth.uid()` e via FKs.
- `profiles` é nosso **espelho público** de `auth.users` apenas com `id` + `email`. Existe para permitir lookup por e-mail sem expor o resto do schema `auth`.
- `task_shares` tem `UNIQUE(task_id, shared_with)` impedindo o mesmo usuário receber a mesma tarefa duas vezes.
- `task_share_links` tem `token` UNIQUE gerado por `encode(gen_random_bytes(16), 'hex')` no Postgres — entropia equivalente a 128 bits.
- Todas as FKs para `auth.users` usam `ON DELETE CASCADE`: deletar a conta apaga automaticamente tarefas, progresso, profile, shares e links públicos.

## Triggers

| Nome                              | Quando                              | O que faz                                                    |
| --------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| `on_auth_user_created`            | `AFTER INSERT ON auth.users`        | Cria a linha em `user_progress` para o novo usuário          |
| `on_auth_user_created_profile`    | `AFTER INSERT ON auth.users`        | Cria a linha em `profiles` (espelho `id` + `email lowercase`)|

Ambos os triggers são `SECURITY DEFINER` e fazem `INSERT … ON CONFLICT DO NOTHING` para serem idempotentes.

## Funções

| Nome                               | Tipo              | Visibilidade |
| ---------------------------------- | ----------------- | ------------ |
| `create_user_progress()`           | trigger function  | interna      |
| `create_profile_for_user()`        | trigger function  | interna      |
| `find_user_id_by_email(text)`      | RPC               | `EXECUTE TO authenticated` |
| `get_incoming_shares()`            | RPC (table-returning) | `EXECUTE TO authenticated` |
| `get_shared_task_by_token(text)`   | RPC (table-returning) | `EXECUTE TO anon, authenticated` |

Todas são `SECURITY DEFINER` com `SET search_path = public` para evitar ataques de search_path injection.

## Índices

```sql
CREATE INDEX tasks_user_id_idx       ON tasks(user_id);
CREATE INDEX tasks_completed_idx     ON tasks(completed);
CREATE INDEX tasks_created_at_idx    ON tasks(created_at DESC);
CREATE INDEX user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX profiles_email_idx      ON profiles(email);
CREATE INDEX task_share_links_token_idx   ON task_share_links(token);
CREATE INDEX task_share_links_task_id_idx ON task_share_links(task_id);
```

## Histórico de migrations

| Data           | Arquivo                                                    | Resumo                                                                  |
| -------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| 2026-03-08     | `20260308191517_create_taskflow_schema.sql`                | `tasks`, `user_progress`, RLS, trigger inicial                          |
| 2026-04-11     | `20260411100000_add_advanced_task_features.sql`            | Colunas avançadas em `tasks` (category, due_date, attachments) + `task_shares` |
| 2026-05-09     | `20260509120000_add_profiles_and_sharing.sql`              | `profiles`, RPCs de lookup/list, novas RLS para sharing                 |
| 2026-05-10     | `20260510140000_add_public_share_links.sql`                | `task_share_links` + RPC `get_shared_task_by_token` (acessível a `anon`) |
