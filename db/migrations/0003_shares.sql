-- 0003_shares.sql
-- Compartilhamento de tarefas: por e-mail (convite aceitar/recusar) e por
-- link público (token, sem login).
--
-- Portado das migrations do Supabase (add_advanced_task_features cria
-- task_shares; add_public_share_links cria task_share_links). SEM RLS:
-- a autorização vai no backend. As RPCs find_user_id_by_email /
-- get_incoming_shares / get_shared_task_by_token viram queries nas rotas.

CREATE TABLE IF NOT EXISTS task_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  shared_by   uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, shared_with)
);

CREATE INDEX IF NOT EXISTS task_shares_shared_with_idx ON task_shares (shared_with);
CREATE INDEX IF NOT EXISTS task_shares_task_id_idx     ON task_shares (task_id);

CREATE TABLE IF NOT EXISTS task_share_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked    boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS task_share_links_token_idx   ON task_share_links (token);
CREATE INDEX IF NOT EXISTS task_share_links_task_id_idx ON task_share_links (task_id);
