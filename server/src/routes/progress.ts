/**
 * Progresso/gamificação do usuário.
 *
 *   GET /progress → retorna a linha de user_progress (cria se ainda não existe)
 *
 * As MUTAÇÕES de progresso não têm endpoint próprio: acontecem como efeito
 * colateral de criar/concluir/editar/excluir tarefas (ver lib/progress.ts).
 */
import { Router } from 'express';
import { withTransaction } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { ensureProgress } from '../lib/progress';

export const progressRouter = Router();
progressRouter.use(requireAuth);

/** GET /progress */
progressRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const progress = await withTransaction((client) => ensureProgress(client, userId));
    res.json({ progress });
  } catch (err) {
    next(err);
  }
});
