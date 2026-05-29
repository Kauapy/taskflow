/**
 * Runner de migrations idempotente.
 *
 * Lê todos os arquivos *.sql em `db/migrations/`, aplica em ordem alfabética,
 * e grava o nome do arquivo aplicado em `_migrations` para não rodar duas vezes.
 *
 * Execução: `npm run migrate`
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { query, closePool } from './db';

const MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', 'db', 'migrations');

async function ensureRegistry(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function listAlreadyApplied(): Promise<Set<string>> {
  const { rows } = await query<{ id: string }>('SELECT id FROM _migrations');
  return new Set(rows.map(r => r.id));
}

async function listFiles(): Promise<string[]> {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries.filter(f => f.endsWith('.sql')).sort();
}

async function applyOne(file: string): Promise<void> {
  const fullPath = path.join(MIGRATIONS_DIR, file);
  const sql = await fs.readFile(fullPath, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`▶ Aplicando ${file}`);
  await query(sql);
  await query('INSERT INTO _migrations (id) VALUES ($1)', [file]);
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`📂 Diretório: ${MIGRATIONS_DIR}`);

  try {
    await fs.access(MIGRATIONS_DIR);
  } catch {
    // eslint-disable-next-line no-console
    console.log('Sem migrations ainda. Pulando.');
    return;
  }

  await ensureRegistry();
  const applied = await listAlreadyApplied();
  const files = await listFiles();

  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Sem arquivos .sql para aplicar.');
    return;
  }

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      // eslint-disable-next-line no-console
      console.log(`✓ ${file} (já aplicada)`);
      continue;
    }
    await applyOne(file);
    count++;
  }

  // eslint-disable-next-line no-console
  console.log(`✅ ${count} migration(s) aplicada(s).`);
}

main()
  .then(async () => {
    await closePool();
    process.exit(0);
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Falha ao aplicar migrations:', err);
    await closePool();
    process.exit(1);
  });
