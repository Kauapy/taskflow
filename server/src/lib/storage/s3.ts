/**
 * Driver de storage S3-compatível (Cloudflare R2, AWS S3, Backblaze B2).
 * É o caminho de produção (STORAGE_DRIVER=s3).
 *
 * A URL pública vem de STORAGE_PUBLIC_URL (ex.: o domínio público do bucket
 * R2 *.r2.dev ou um domínio customizado). O upload usa ACL public-read
 * implícito via bucket configurado como público.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../../config';
import { StorageDriver, StoredFile, buildKey } from './types';

export class S3Storage implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private publicBase: string;

  constructor() {
    const s3 = config.storage.s3;
    // O config já garante (validação condicional) que estas vars existem
    // quando STORAGE_DRIVER=s3.
    this.client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      forcePathStyle: true, // necessário para R2/B2 e MinIO
      credentials: {
        accessKeyId: s3.accessKey!,
        secretAccessKey: s3.secretKey!,
      },
    });
    this.bucket = s3.bucket!;
    if (!config.storage.publicUrl) {
      throw new Error('STORAGE_PUBLIC_URL é obrigatória quando STORAGE_DRIVER=s3.');
    }
    this.publicBase = config.storage.publicUrl.replace(/\/$/, '');
  }

  async upload(params: {
    userId: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredFile> {
    const key = buildKey(params.userId, params.originalName);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType,
      })
    );
    return {
      key,
      url: `${this.publicBase}/${key}`,
      name: params.originalName,
      size: params.buffer.length,
      type: params.mimeType,
    };
  }

  async remove(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }
}
