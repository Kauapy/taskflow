/**
 * Contrato comum dos drivers de storage. Permite trocar entre disco local
 * (dev) e S3-compatível (R2/AWS/B2, produção) sem mexer nas rotas.
 */
export interface StoredFile {
  /** Caminho interno usado para deletar (`{userId}/{timestamp}-{nome}`). */
  key: string;
  /** URL pública de download/leitura. */
  url: string;
  /** Nome original do arquivo (para exibir na UI). */
  name: string;
  size: number;
  type: string;
}

export interface StorageDriver {
  /** Salva o buffer e retorna metadados + URL pública. */
  upload(params: {
    userId: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredFile>;

  /** Remove pelo key. Idempotente (não falha se já não existe). */
  remove(key: string): Promise<void>;
}

/** Sanitiza o nome do arquivo e monta o key `{userId}/{timestamp}-{nome}`. */
export function buildKey(userId: string, originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'arquivo';
  return `${userId}/${Date.now()}-${safe}`;
}
