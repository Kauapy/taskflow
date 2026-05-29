/**
 * Pool de conexões Postgres e helpers de query.
 *
 * Use `query(sql, params)` para chamadas simples.
 * Use `withTransaction(async (client) => {...})` para múltiplas operações atômicas.
 *
 * SEMPRE use placeholders ($1, $2, …) — nunca interpole valores na string SQL,
 * sob pena de SQL injection.
 */
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  // Em produção atrás de proxy SSL é comum precisar de:
  // ssl: config.isProd ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Pool Postgres error:', err);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Fecha o pool — usado em scripts (migrate.ts) e em testes para sair limpo.
 * NÃO chame em request handlers; o pool é compartilhado em todo o processo.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
