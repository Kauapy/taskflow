/*
  # Taskflow - Sistema de Gerenciamento de Tarefas Gamificado
  
  1. Novas Tabelas
    - `tasks`
      - `id` (uuid, primary key) - Identificador único da tarefa
      - `user_id` (uuid) - Referência ao usuário (auth.users)
      - `title` (text) - Título/descrição da tarefa
      - `urgency` (text) - Nível de urgência: baixa, média ou alta
      - `location` (text) - Local relacionado à tarefa
      - `completed` (boolean) - Status de conclusão
      - `completed_at` (timestamptz) - Data/hora de conclusão
      - `created_at` (timestamptz) - Data/hora de criação
    
    - `user_progress`
      - `id` (uuid, primary key) - Identificador único
      - `user_id` (uuid) - Referência ao usuário (auth.users)
      - `total_tasks_created` (integer) - Total de tarefas criadas
      - `total_tasks_completed` (integer) - Total de tarefas completadas
      - `total_locations` (integer) - Total de localizações únicas usadas
      - `current_streak` (integer) - Sequência atual de dias com tarefas completadas
      - `best_streak` (integer) - Melhor sequência de dias
      - `level` (integer) - Nível do usuário no sistema de gamificação
      - `experience_points` (integer) - Pontos de experiência acumulados
      - `last_activity` (timestamptz) - Última atividade registrada
      - `created_at` (timestamptz) - Data de criação do registro
      - `updated_at` (timestamptz) - Última atualização
  
  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados acessarem apenas seus próprios dados
    - Políticas para inserção, leitura, atualização e exclusão
*/

-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  urgency text NOT NULL DEFAULT 'media' CHECK (urgency IN ('baixa', 'media', 'alta')),
  location text DEFAULT '',
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_tasks_created integer DEFAULT 0,
  total_tasks_completed integer DEFAULT 0,
  total_locations integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  level integer DEFAULT 1,
  experience_points integer DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para a tabela user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks(completed);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);

-- Função para criar progresso automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION create_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar progresso automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_progress();