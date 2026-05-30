/**
 * Rotas PÚBLICAS (sem autenticação).
 *
 *   GET /public/shared/:token → tarefa compartilhada por link público
 *
 * Substitui a RPC get_shared_task_by_token (SECURITY DEFINER) do Supabase.
 * Valida o token (não revogado, não expirado), incrementa o contador de
 * visualizações e devolve os dados da tarefa + e-mail do dono.
 *
 * Importante: NÃO usa requireAuth — qualquer pessoa com o link acessa.
 */
import { Router } from 'express';
import { withTransaction } from '../db';
import { Errors } from '../middleware/error';

export const publicRouter = Router();

interface SharedTaskRow {
  task_id: string;
  title: string;
  urgency: string;
  category: string;
  location: string | null;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  shared_by_email: string | null;
  view_count: number;
}

publicRouter.get('/shared/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const row = await withTransaction(async (client) => {
      // Valida e incrementa o contador atomicamente. O RETURNING já entrega
      // o view_count novo. Token inválido/expirado/revogado → 0 linhas.
      const link = await client.query<{ id: string; task_id: string; view_count: number }>(
        `UPDATE task_share_links
            SET view_count = view_count + 1
          WHERE token = $1
            AND revoked = false
            AND (expires_at IS NULL OR expires_at > now())
          RETURNING id, task_id, view_count`,
        [token]
      );
      if (link.rowCount === 0) {
        return null;
      }
      const { task_id, view_count } = link.rows[0];

      const taskRes = await client.query<SharedTaskRow>(
        `SELECT t.id AS task_id, t.title, t.urgency, t.category, t.location,
                t.completed, t.due_date, t.created_at,
                p.email AS shared_by_email,
                $2::int AS view_count
           FROM tasks t
           LEFT JOIN profiles p ON p.id = t.user_id
          WHERE t.id = $1`,
        [task_id, view_count]
      );
      return taskRes.rows[0] ?? null;
    });

    if (!row) {
      throw Errors.notFound('Link inválido ou expirado.', 'invalid_token');
    }

    res.json({ task: row });
  } catch (err) {
    next(err);
  }
});
