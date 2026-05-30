/**
 * CRUD de tarefas. Substitui as queries supabase.from('tasks') do frontend.
 *
 *   GET    /tasks               → lista as tarefas do usuário (mais recentes 1º)
 *   POST   /tasks               → cria tarefa (+10 XP, recalcula locais)
 *   PATCH  /tasks/:id           → edita campos
 *   POST   /tasks/:id/complete  → marca como concluída (+50 XP, streak)
 *   DELETE /tasks/:id           → exclui (recalcula locais)
 *
 * Autorização: TODA query filtra por user_id = req.user.id. Um usuário
 * nunca vê nem altera tarefa de outro (substitui o RLS do Supabase).
 */
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { Errors } from '../middleware/error';
import { onTaskCreated, onTaskCompleted, recalcLocations } from '../lib/progress';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  urgency: 'baixa' | 'media' | 'alta';
  location: string;
  category: string;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  attachments: string[];
  shared_with: string[];
  created_at: string;
}

const urgencyEnum = z.enum(['baixa', 'media', 'alta']);

const createSchema = z.object({
  title: z.string().trim().min(1, 'O título é obrigatório.').max(200),
  urgency: urgencyEnum.default('media'),
  location: z.string().max(100).default(''),
  category: z.string().max(50).default(''),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
  attachments: z.array(z.string().url()).max(20).default([]),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  urgency: urgencyEnum.optional(),
  location: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
  attachments: z.array(z.string().url()).max(20).optional(),
});

/** GET /tasks */
tasksRouter.get('/', async (req, res, next) => {
  try {
    const result = await query<TaskRow>(
      `SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user!.id]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
});

/** POST /tasks */
tasksRouter.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const userId = req.user!.id;

    const task = await withTransaction(async (client) => {
      const inserted = await client.query<TaskRow>(
        `INSERT INTO tasks (user_id, title, urgency, location, category, due_date, attachments)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          body.title,
          body.urgency,
          body.location,
          body.category,
          body.due_date ?? null,
          body.attachments,
        ]
      );
      await onTaskCreated(client, userId);
      return inserted.rows[0];
    });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

/** PATCH /tasks/:id — edição de campos (não conclui). */
tasksRouter.patch('/:id', async (req, res, next) => {
  try {
    const updates = updateSchema.parse(req.body);
    const userId = req.user!.id;
    const { id } = req.params;

    const keys = Object.keys(updates) as (keyof typeof updates)[];
    if (keys.length === 0) {
      throw Errors.badRequest('Nenhum campo para atualizar.');
    }

    // Monta SET dinâmico com placeholders — nomes de coluna vêm de um
    // allowlist (as chaves do schema), valores sempre parametrizados.
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const key of keys) {
      setClauses.push(`${key} = $${i}`);
      values.push(updates[key] ?? null);
      i++;
    }
    values.push(id, userId);

    const task = await withTransaction(async (client) => {
      const result = await client.query<TaskRow>(
        `UPDATE tasks SET ${setClauses.join(', ')}
          WHERE id = $${i} AND user_id = $${i + 1}
          RETURNING *`,
        values
      );
      if (result.rowCount === 0) {
        throw Errors.notFound('Tarefa não encontrada.');
      }
      if ('location' in updates) {
        await recalcLocations(client, userId);
      }
      return result.rows[0];
    });

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

/** POST /tasks/:id/complete */
tasksRouter.post('/:id/complete', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await withTransaction(async (client) => {
      const result = await client.query<TaskRow>(
        `UPDATE tasks
            SET completed = true, completed_at = now()
          WHERE id = $1 AND user_id = $2 AND completed = false
          RETURNING *`,
        [id, userId]
      );
      if (result.rowCount === 0) {
        // Ou não existe, ou já estava concluída. Verifica qual.
        const exists = await client.query(
          `SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );
        if (exists.rowCount === 0) throw Errors.notFound('Tarefa não encontrada.');
        throw Errors.conflict('Tarefa já está concluída.', 'already_completed');
      }
      await onTaskCompleted(client, userId);
      return result.rows[0];
    });

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

/** DELETE /tasks/:id */
tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await withTransaction(async (client) => {
      const result = await client.query(
        `DELETE FROM tasks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (result.rowCount === 0) {
        throw Errors.notFound('Tarefa não encontrada.');
      }
      await recalcLocations(client, userId);
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
