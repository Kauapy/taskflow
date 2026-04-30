-- Migration: adiciona colunas ausentes na tabela tasks
-- Execute este script no SQL Editor do Supabase: https://supabase.com/dashboard → SQL Editor

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category    TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS due_date    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attachments TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shared_with TEXT[]  NOT NULL DEFAULT '{}';

-- Após rodar este script, refresque o schema cache do Supabase:
-- Vá em Database → Replication → clique em "Reload schema"
-- OU simplesmente aguarde até 60s para o cache atualizar automaticamente.
