/**
 * Driver de storage em disco local (desenvolvimento).
 *
 * Salva em STORAGE_DISK_DIR/{userId}/{timestamp}-{nome}. Os arquivos são
 * servidos estaticamente em /static/uploads/* (ver index.ts), então a URL
 * pública é montada a partir de FRONTEND-independent base do próprio backend.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { config } from '../../config';
import { StorageDriver, StoredFile, buildKey } from './types';

export class DiskStorage implements StorageDriver {
  private baseDir = config.storage.diskDir;
  // URL base pública: STORAGE_PUBLIC_URL se setada, senão o próprio backend.
  private publicBase = config.storage.publicUrl ?? `http://localhost:${config.port}/static/uploads`;

  async upload(params: {
    userId: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredFile> {
    const key = buildKey(params.userId, params.originalName);
    const fullPath = path.join(this.baseDir, key);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, params.buffer);

    return {
      key,
      url: `${this.publicBase}/${key}`,
      name: params.originalName,
      size: params.buffer.length,
      type: params.mimeType,
    };
  }

  async remove(key: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      // ENOENT (já não existe) é ok; outros erros propagam.
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}
