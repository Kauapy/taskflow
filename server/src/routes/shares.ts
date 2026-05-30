/**
 * Compartilhamento de tarefas (parte autenticada).
 *
 *   POST   /shares                  { taskId, email }      → convidar por e-mail
 *   GET    /shares/incoming                                → convites recebidos
 *   POST   /shares/:id/accept                              → aceitar convite
 *   DELETE /shares/:id                                     → recusar/remover
 *
 *   POST   /share-links             { taskId, expiresInDays? } → gerar link público
 *   GET    /share-links?taskId=...                         → listar links de uma tarefa
 *   POST   /share-links/:id/revoke                         → revogar link
 *
 * Substitui as RPCs find_user_id_by_email e get_incoming_shares do Supabase,
 * mais o CRUD de task_shares / task_share_links.
 */
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { Errors } from '../middleware/error';

// Montado em '/' no index.ts. requireAuth é aplicado em CADA rota (não via
// router.use) para que caminhos não-casados caiam no 404 handler, em vez de
// receberem 401 de um catch-all.
export const sharesRouter = Router();

// ── Compartilhar por e-mail ──────────────────────────────────────────────────

const shareSchema = z.object({
  taskId: z.string().uuid('taskId inválido.'),
  email: z.string().email('E-mail inválido.'),
});

sharesRouter.post('/shares', requireAuth, async (req, res, next) => {
  try {
    const { taskId, email } = shareSchema.parse(req.body);
    const me = req.user!;
    const target = email.trim().toLowerCase();

    if (target === me.email.toLowerCase()) {
      throw Errors.badRequest('Você não pode compartilhar com você mesmo.', 'self_share');
    }

    const result = await withTransaction(async (client) => {
      // A tarefa precisa ser do usuário logado.
      const taskRes = await client.query<{ shared_with: string[] }>(
        `SELECT shared_with FROM tasks WHERE id = $1 AND user_id = $2`,
        [taskId, me.id]
      );
      if (taskRes.rowCount === 0) {
        throw Errors.notFound('Tarefa não encontrada.');
      }

      // Lookup do destinatário (substitui find_user_id_by_email).
      const recipientRes = await client.query<{ id: string }>(
        `SELECT id FROM profiles WHERE email = $1`,
        [target]
      );
      const recipient = recipientRes.rows[0];
      if (!recipient) {
        throw Errors.notFound('Nenhum usuário cadastrado com esse e-mail.', 'recipient_not_found');
      }

      // Cria o convite (UNIQUE(task_id, shared_with) evita duplicata).
      try {
        await client.query(
          `INSERT INTO task_shares (task_id, shared_by, shared_with, status)
           VALUES ($1, $2, $3, 'pending')`,
          [taskId, me.id, recipient.id]
        );
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          throw Errors.conflict('Esta tarefa já foi compartilhada com esse usuário.', 'already_shared');
        }
        throw err;
      }

      // Mantém o array shared_with da tarefa em dia (espelha o comportamento antigo).
      await client.query(
        `UPDATE tasks
            SET shared_with = (
              SELECT ARRAY(SELECT DISTINCT unnest(shared_with || $2::uuid))
            )
          WHERE id = $1`,
        [taskId, recipient.id]
      );

      return { recipientId: recipient.id };
    });

    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

interface IncomingShareRow {
  id: string;
  task_id: string;
  status: string;
  shared_by: string;
  sharer_email: string | null;
  task_title: string | null;
  task_urgency: string | null;
  task_completed: boolean | null;
  task_due_date: string | null;
  task_location: string | null;
  created_at: string;
}

sharesRouter.get('/shares/incoming', requireAuth, async (req, res, next) => {
  try {
    const result = await query<IncomingShareRow>(
      `SELECT ts.id, ts.task_id, ts.status, ts.shared_by,
              p.email   AS sharer_email,
              t.title   AS task_title,
              t.urgency AS task_urgency,
              t.completed AS task_completed,
              t.due_date  AS task_due_date,
              t.location  AS task_location,
              ts.created_at
         FROM task_shares ts
         LEFT JOIN profiles p ON p.id = ts.shared_by
         LEFT JOIN tasks t    ON t.id = ts.task_id
        WHERE ts.shared_with = $1
        ORDER BY ts.created_at DESC`,
      [req.user!.id]
    );
    res.json({ incoming: result.rows });
  } catch (err) {
    next(err);
  }
});

sharesRouter.post('/shares/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE task_shares SET status = 'accepted'
        WHERE id = $1 AND shared_with = $2`,
      [req.params.id, req.user!.id]
    );
    if (result.rowCount === 0) {
      throw Errors.notFound('Convite não encontrado.');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

sharesRouter.delete('/shares/:id', requireAuth, async (req, res, next) => {
  try {
    // Tanto quem enviou (revogar) quanto quem recebeu (recusar) podem apagar.
    const result = await query(
      `DELETE FROM task_shares
        WHERE id = $1 AND (shared_with = $2 OR shared_by = $2)`,
      [req.params.id, req.user!.id]
    );
    if (result.rowCount === 0) {
      throw Errors.notFound('Convite não encontrado.');
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── Links públicos ───────────────────────────────────────────────────────────

const createLinkSchema = z.object({
  taskId: z.string().uuid('taskId inválido.'),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

interface ShareLinkRow {
  id: string;
  task_id: string;
  token: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
  view_count: number;
}

sharesRouter.post('/share-links', requireAuth, async (req, res, next) => {
  try {
    const { taskId, expiresInDays } = createLinkSchema.parse(req.body);
    const me = req.user!;

    const link = await withTransaction(async (client) => {
      const taskRes = await client.query(
        `SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2`,
        [taskId, me.id]
      );
      if (taskRes.rowCount === 0) {
        throw Errors.notFound('Tarefa não encontrada.');
      }

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
        : null;

      const inserted = await client.query<ShareLinkRow>(
        `INSERT INTO task_share_links (task_id, created_by, expires_at)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [taskId, me.id, expiresAt]
      );
      return inserted.rows[0];
    });

    res.status(201).json({ link });
  } catch (err) {
    next(err);
  }
});

sharesRouter.get('/share-links', requireAuth, async (req, res, next) => {
  try {
    const taskId = z.string().uuid().parse(req.query.taskId);
    const result = await query<ShareLinkRow>(
      `SELECT * FROM task_share_links
        WHERE task_id = $1 AND created_by = $2
        ORDER BY created_at DESC`,
      [taskId, req.user!.id]
    );
    res.json({ links: result.rows });
  } catch (err) {
    next(err);
  }
});

sharesRouter.post('/share-links/:id/revoke', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE task_share_links SET revoked = true
        WHERE id = $1 AND created_by = $2`,
      [req.params.id, req.user!.id]
    );
    if (result.rowCount === 0) {
      throw Errors.notFound('Link não encontrado.');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
