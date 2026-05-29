-- 0001_auth.sql
-- Autenticação própria (substitui o auth.users interno do Supabase).
--
-- No Supabase, a tabela auth.users era gerenciada pela plataforma e o e-mail
-- ficava escondido. Aqui, nós mesmos guardamos credenciais (hash bcrypt) e
-- mantemos um espelho público de e-mails em profiles para lookup de
-- compartilhamento (substitui a antiga RPC find_user_id_by_email).

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- Usuários + credenciais
CREATE TABLE IF NOT EXISTS auth_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Garante e-mail sempre em minúsculas/sem espaços (case-insensitive lookup)
CREATE INDEX IF NOT EXISTS auth_users_email_idx ON auth_users (lower(email));

-- Espelho público de e-mails (mesma ideia da tabela profiles do Supabase,
-- mas agora FK aponta para auth_users em vez de auth.users).
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);
