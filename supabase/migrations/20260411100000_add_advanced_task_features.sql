-- Adicionar campos avançados às tarefas para TCC
-- Adiciona categoria, data de vencimento, anexos e compartilhamento

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb; -- Array de URLs ou paths
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS shared_with uuid[] DEFAULT '{}'; -- Array de user_ids

-- Criar tabela para convites de compartilhamento (opcional, para gerenciar convites)
CREATE TABLE IF NOT EXISTS task_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, shared_with)
);

-- Habilitar RLS na nova tabela
ALTER TABLE task_shares ENABLE ROW LEVEL SECURITY;

-- Políticas para task_shares
CREATE POLICY "Users can view shares they sent or received"
  ON task_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can insert shares they send"
  ON task_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update shares they received"
  ON task_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() = shared_with)
  WITH CHECK (auth.uid() = shared_with);