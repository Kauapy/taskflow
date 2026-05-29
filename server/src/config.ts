/**
 * Carrega e valida as variáveis de ambiente do servidor.
 *
 * Em dev, lê de `.env` na raiz do `server/`. Em produção, espera as vars
 * setadas pelo host (Railway/Render/etc).
 */
import 'dotenv/config';
import { z } from 'zod';
import * as path from 'node:path';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Postgres
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL é obrigatória. Ex.: postgres://postgres:postgres@localhost:5432/taskflow'),

  // CORS
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),

  // Auth
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET precisa ter >=16 caracteres (use openssl rand -base64 32)'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  // Storage
  STORAGE_DRIVER: z.enum(['disk', 's3']).default('disk'),
  STORAGE_DISK_DIR: z.string().default('./uploads'),
  STORAGE_PUBLIC_URL: z.string().url().optional(), // base p/ links públicos quando driver=s3
  // S3-compat (R2/AWS/B2)
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Variáveis de ambiente inválidas:');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

// Validações condicionais
if (env.STORAGE_DRIVER === 's3') {
  const missing = (['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'] as const)
    .filter(k => !env[k]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`❌ STORAGE_DRIVER=s3 mas faltam vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  databaseUrl: env.DATABASE_URL,
  frontendOrigin: env.FRONTEND_ORIGIN,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  bcryptRounds: env.BCRYPT_ROUNDS,
  storage: {
    driver: env.STORAGE_DRIVER,
    diskDir: path.resolve(env.STORAGE_DISK_DIR),
    publicUrl: env.STORAGE_PUBLIC_URL,
    s3: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION ?? 'auto',
      bucket: env.S3_BUCKET,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
    },
  },
};
