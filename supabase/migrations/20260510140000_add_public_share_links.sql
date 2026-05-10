/*
  # Compartilhamento de tarefa por link público

  Permite ao dono gerar um link único (token aleatório) que dá acesso
  somente-leitura à tarefa para qualquer pessoa, sem necessidade de
  cadastro. Complementa — não substitui — o compartilhamento por
  e-mail registrado da migration 20260509120000.

  1. Nova tabela: task_share_links
     - token: string aleatória única (16 bytes hex = 32 chars)
     - revoked: dono pode revogar a qualquer momento
     - expires_at: validade opcional (NULL = sem expiração)
     - view_count: estatística de visualizações

  2. RLS: dono gerencia seus próprios links. A leitura pública passa
     pela RPC SECURITY DEFINER abaixo, não pela tabela.

  3. RPC get_shared_task_by_token(p_token): valida o token, incrementa
     view_count e retorna os dados da tarefa + e-mail do dono. Aceita
     chamadas de anon (sem login).
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tabela
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.task_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS task_share_links_token_idx
  ON public.task_share_links (token);

CREATE INDEX IF NOT EXISTS task_share_links_task_id_idx
  ON public.task_share_links (task_id);

ALTER TABLE public.task_share_links ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS: apenas o dono enxerga e gerencia seus links
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Owner can view own share links" ON public.task_share_links;
CREATE POLICY "Owner can view own share links"
  ON public.task_share_links FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owner can create share links for own tasks" ON public.task_share_links;
CREATE POLICY "Owner can create share links for own tasks"
  ON public.task_share_links FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_share_links.task_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner can update own share links" ON public.task_share_links;
CREATE POLICY "Owner can update own share links"
  ON public.task_share_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owner can delete own share links" ON public.task_share_links;
CREATE POLICY "Owner can delete own share links"
  ON public.task_share_links FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RPC pública (SECURITY DEFINER): valida token e retorna a tarefa
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_shared_task_by_token(p_token text)
RETURNS TABLE (
  task_id uuid,
  title text,
  urgency text,
  category text,
  location text,
  completed boolean,
  due_date timestamptz,
  created_at timestamptz,
  shared_by_email text,
  view_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_link_id uuid;
  v_task_id uuid;
  v_count integer;
BEGIN
  -- Valida o token: existe, não revogado, não expirado.
  -- Aliases explícitos (tsl.) evitam ambiguidade com OUT params da TABLE.
  SELECT tsl.id, tsl.task_id INTO v_link_id, v_task_id
  FROM public.task_share_links tsl
  WHERE tsl.token = p_token
    AND tsl.revoked = false
    AND (tsl.expires_at IS NULL OR tsl.expires_at > now());

  -- Token inválido → retorna vazio (cliente trata como 404)
  IF v_link_id IS NULL THEN
    RETURN;
  END IF;

  -- Incrementa contador de visualizações e captura novo valor
  UPDATE public.task_share_links AS tsl
  SET view_count = tsl.view_count + 1
  WHERE tsl.id = v_link_id
  RETURNING tsl.view_count INTO v_count;

  -- Retorna a tarefa + e-mail do dono (via JOIN com profiles)
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.urgency,
    t.category,
    t.location,
    t.completed,
    t.due_date,
    t.created_at,
    p.email,
    v_count
  FROM public.tasks t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE t.id = v_task_id;
END;
$$;

-- IMPORTANTE: anon precisa executar para a página pública funcionar sem login
GRANT EXECUTE ON FUNCTION public.get_shared_task_by_token(text)
  TO anon, authenticated;
