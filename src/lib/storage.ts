import { supabase } from './supabase';

const BUCKET = 'task-attachments';

export interface UploadedAttachment {
  /** Caminho dentro do bucket (`{user_id}/{timestamp}-{filename}`) — usado para deletar. */
  path: string;
  /** URL pública para download/leitura. */
  url: string;
  /** Nome original do arquivo (sem timestamp), pra UI. */
  name: string;
  size: number;
  type: string;
}

/**
 * Faz upload de um arquivo para o bucket task-attachments dentro da pasta
 * do usuário. Retorna a URL pública que será salva em tasks.attachments.
 */
export async function uploadAttachment(
  file: File,
  userId: string
): Promise<{ data: UploadedAttachment | null; error: string | null }> {
  // Sanitiza o nome para evitar caracteres problemáticos em URLs
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    return { data: null, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    data: {
      path,
      url: data.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    },
    error: null,
  };
}

/**
 * Apaga um anexo pelo seu caminho dentro do bucket. RLS garante que só o
 * dono consegue deletar; chamadas de outros usuários falham silenciosamente.
 */
export async function deleteAttachment(path: string): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error: error?.message ?? null };
}

/**
 * Dado uma URL pública (`.../storage/v1/object/public/task-attachments/{userId}/{file}`),
 * extrai o caminho usado para deletar. Retorna null se não bater com o padrão.
 */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

/**
 * Tenta extrair um nome amigável do arquivo a partir da URL pública
 * (remove o `{timestamp}-` que o uploader adicionou). Cai pra "anexo" se
 * a URL não seguir o padrão esperado.
 */
export function nameFromPublicUrl(url: string): string {
  try {
    const fileName = decodeURIComponent(url.split('/').pop() ?? '');
    // Remove o prefixo numérico {timestamp}-
    const stripped = fileName.replace(/^\d{10,}-/, '');
    return stripped || 'anexo';
  } catch {
    return 'anexo';
  }
}
