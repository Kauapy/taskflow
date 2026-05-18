/*
  # Bucket de Storage para anexos de tarefa

  Cria o bucket `task-attachments` e as policies RLS no storage.objects
  que permitem:
  - Cada usuário fazer upload APENAS dentro da sua própria pasta
    (cujo nome é o user_id).
  - Qualquer pessoa (anon) ler os arquivos — afinal o uso típico é
    enviar o link da tarefa via compartilhamento público, e o
    destinatário precisa baixar o anexo sem login.
  - O dono do arquivo (e somente ele) deletar.

  Estrutura de pasta:
  task-attachments/
    {user_id}/
      {timestamp}-{filename}

  Tamanho máximo (10 MB) e tipos MIME são opcionais e ficam por
  configuração do painel (Settings → Storage → file size limit).
*/

-- 1. Cria o bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies de RLS em storage.objects (escopo: bucket task-attachments)

DROP POLICY IF EXISTS "task_attachments_owner_upload" ON storage.objects;
CREATE POLICY "task_attachments_owner_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "task_attachments_public_read" ON storage.objects;
CREATE POLICY "task_attachments_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "task_attachments_owner_delete" ON storage.objects;
CREATE POLICY "task_attachments_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "task_attachments_owner_update" ON storage.objects;
CREATE POLICY "task_attachments_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
