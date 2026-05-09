/*
  # Profiles + Compartilhamento de Tarefas

  Adiciona infraestrutura para o usuário compartilhar tarefas com outros
  usuários via e-mail. O e-mail mora em auth.users (escondido pela API),
  então criamos um espelho público (profiles) + RPCs SECURITY DEFINER
  que fazem o trabalho de lookup respeitando privacidade.

  1. Nova tabela
    - public.profiles
      - id (uuid PK, FK auth.users.id)
      - email (text UNIQUE, lowercase)
      - created_at (timestamptz)

  2. Trigger
    - on_auth_user_created_profile: popula profiles a cada signup.

  3. RPCs (SECURITY DEFINER)
    - find_user_id_by_email(p_email): retorna o user_id se houver match exato
      por e-mail (lowercase + trim). Permite achar com quem compartilhar
      sem expor o resto da tabela profiles.
    - get_incoming_shares(): retorna os task_shares onde o caller é o
      destinatário, com title/urgency/etc. da tarefa e o e-mail do remetente
      já resolvidos. Single round-trip do frontend.

  4. Novas policies de RLS
    - tasks: SELECT permitido se existir um task_share aceito com o caller.
    - task_shares: DELETE permitido para sharer (revogar) e destinatário (recusar).
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Por padrão, o usuário só enxerga seu próprio profile via SELECT direto.
-- Cross-user lookup vai pelas RPCs SECURITY DEFINER abaixo.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Trigger para popular profiles automaticamente
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, lower(NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- Backfill: traz e-mails de usuários que já existem
INSERT INTO public.profiles (id, email)
SELECT id, lower(email) FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RPCs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.find_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.profiles
  WHERE email = lower(trim(p_email));
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_incoming_shares()
RETURNS TABLE (
  id uuid,
  task_id uuid,
  status text,
  shared_by uuid,
  sharer_email text,
  task_title text,
  task_urgency text,
  task_completed boolean,
  task_due_date timestamptz,
  task_location text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.id,
    ts.task_id,
    ts.status,
    ts.shared_by,
    p.email AS sharer_email,
    t.title AS task_title,
    t.urgency AS task_urgency,
    t.completed AS task_completed,
    t.due_date AS task_due_date,
    t.location AS task_location,
    ts.created_at
  FROM public.task_shares ts
  LEFT JOIN public.profiles p ON p.id = ts.shared_by
  LEFT JOIN public.tasks t ON t.id = ts.task_id
  WHERE ts.shared_with = auth.uid()
  ORDER BY ts.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_incoming_shares() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Novas policies de RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Destinatário pode ler tarefas que aceitou
DROP POLICY IF EXISTS "Users can view tasks shared and accepted" ON public.tasks;
CREATE POLICY "Users can view tasks shared and accepted"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_shares
      WHERE task_shares.task_id = tasks.id
        AND task_shares.shared_with = auth.uid()
        AND task_shares.status = 'accepted'
    )
  );

-- Sharer pode revogar; destinatário pode recusar/remover
DROP POLICY IF EXISTS "Sharer can delete their shares" ON public.task_shares;
CREATE POLICY "Sharer can delete their shares"
  ON public.task_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by);

DROP POLICY IF EXISTS "Receiver can delete shares received" ON public.task_shares;
CREATE POLICY "Receiver can delete shares received"
  ON public.task_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_with);
