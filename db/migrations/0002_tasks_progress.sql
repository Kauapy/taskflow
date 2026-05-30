-- 0002_tasks_progress.sql
-- Tarefas + progresso/gamificação.
--
-- Portado das migrations do Supabase (create_taskflow_schema +
-- add_advanced_task_features), SEM RLS e SEM triggers: a autorização
-- (cada usuário só acessa o que é seu) agora é feita no backend, em cada
-- query (WHERE user_id = $autenticado). FKs apontam para auth_users.

CREATE TABLE IF NOT EXISTS tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  urgency      text NOT NULL DEFAULT 'media' CHECK (urgency IN ('baixa', 'media', 'alta')),
  location     text NOT NULL DEFAULT '',
  category     text NOT NULL DEFAULT '',
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  due_date     timestamptz,
  attachments  text[] NOT NULL DEFAULT '{}',
  shared_with  uuid[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx    ON tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_completed_idx   ON tasks (completed);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx  ON tasks (created_at DESC);

CREATE TABLE IF NOT EXISTS user_progress (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
  total_tasks_created   integer NOT NULL DEFAULT 0,
  total_tasks_completed integer NOT NULL DEFAULT 0,
  total_locations       integer NOT NULL DEFAULT 0,
  current_streak        integer NOT NULL DEFAULT 0,
  best_streak           integer NOT NULL DEFAULT 0,
  level                 integer NOT NULL DEFAULT 1,
  experience_points     integer NOT NULL DEFAULT 0,
  last_activity         timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress (user_id);
