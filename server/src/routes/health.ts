/**
 * Healthcheck: GET /health
 *
 * Retorna 200 se o processo está vivo E o banco responde.
 * Usado por load balancers, scripts de deploy, monitoração, etc.
 */
import { Router } from 'express';
import { query } from '../db';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await query<{ ok: number }>('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      db: rows[0]?.ok === 1 ? 'ok' : 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      db: 'error',
      detail: err instanceof Error ? err.message : 'unknown',
    });
  }
});
