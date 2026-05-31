/**
 * Helpers de anexos no frontend. Antes falavam com o Supabase Storage;
 * agora batem no endpoint /uploads do backend próprio.
 */
import { apiUpload, apiFetch, ApiError } from './api';

export interface UploadedAttachment {
  /** key interno (`{userId}/{timestamp}-{nome}`) — usado para deletar. */
  key: string;
  /** URL pública de download/leitura — guardada em tasks.attachments. */
  url: string;
  name: string;
  size: number;
  type: string;
}

export async function uploadAttachment(
  file: File
): Promise<{ data: UploadedAttachment | null; error: string | null }> {
  try {
    const form = new FormData();
    form.append('file', file);
    const { attachment } = await apiUpload<{ attachment: UploadedAttachment }>('/uploads', form);
    return { data: attachment, error: null };
  } catch (err) {
    return { data: null, error: err instanceof ApiError ? err.message : 'Falha no upload.' };
  }
}

export async function deleteAttachment(key: string): Promise<{ error: string | null }> {
  try {
    await apiFetch('DELETE', '/uploads', { key });
    return { error: null };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : 'Falha ao excluir.' };
  }
}

/**
 * Nome amigável a partir da URL pública (remove o prefixo {timestamp}-).
 * Funciona tanto para URLs do disco local quanto do S3/R2.
 */
export function nameFromPublicUrl(url: string): string {
  try {
    const fileName = decodeURIComponent(url.split('/').pop() ?? '');
    const stripped = fileName.replace(/^\d{10,}-/, '');
    return stripped || 'anexo';
  } catch {
    return 'anexo';
  }
}
