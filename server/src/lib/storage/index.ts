/**
 * Seleciona o driver de storage conforme STORAGE_DRIVER.
 * O resto da app importa só `storage` daqui — não conhece o driver concreto.
 */
import { config } from '../../config';
import { StorageDriver } from './types';
import { DiskStorage } from './disk';
import { S3Storage } from './s3';

export const storage: StorageDriver =
  config.storage.driver === 's3' ? new S3Storage() : new DiskStorage();

export type { StoredFile } from './types';
