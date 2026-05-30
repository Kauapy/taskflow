/**
 * Regras de progresso/gamificação. Centraliza o que antes estava espalhado
 * no useTasks.updateProgress do frontend.
 *
 * - Criar tarefa:    +10 XP, total_tasks_created++, recalcula total_locations.
 * - Concluir tarefa: +50 XP, total_tasks_completed++, atualiza streak.
 * - Nível derivado:  floor(xp / 500) + 1.
 *
 * Todas as funções recebem um PoolClient para rodar dentro da MESMA
 * transação da operação de tarefa (atomicidade).
 */
import { PoolClient } from 'pg';
import { applyStreakOnCompletion } from './streak';

export const XP_PER_CREATE = 10;
export const XP_PER_COMPLETE = 50;
export const XP_PER_LEVEL = 500;

export interface ProgressRow {
  id: string;
  user_id: string;
  total_tasks_created: number;
  total_tasks_completed: number;
  total_locations: number;
  current_streak: number;
  best_streak: number;
  level: number;
  experience_points: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Garante que existe uma linha de progresso para o usuário. Idempotente.
 * Retorna a linha (criada ou existente).
 */
export async function ensureProgress(
  client: PoolClient,
  userId: string
): Promise<ProgressRow> {
  const result = await client.query<ProgressRow>(
    `INSERT INTO user_progress (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

/** Conta localizações distintas não-vazias do usuário. */
async function countLocations(client: PoolClient, userId: string): Promise<number> {
  const r = await client.query<{ count: string }>(
    `SELECT COUNT(DISTINCT location) AS count
       FROM tasks
      WHERE user_id = $1 AND location <> ''`,
    [userId]
  );
  return Number(r.rows[0]?.count ?? 0);
}

/** Aplica os efeitos de CRIAR uma tarefa no progresso. */
export async function onTaskCreated(client: PoolClient, userId: string): Promise<void> {
  const progress = await ensureProgress(client, userId);
  const newXp = progress.experience_points + XP_PER_CREATE;
  const locations = await countLocations(client, userId);

  await client.query(
    `UPDATE user_progress
        SET total_tasks_created = total_tasks_created + 1,
            total_locations = $2,
            experience_points = $3,
            level = $4,
            last_activity = now(),
            updated_at = now()
      WHERE user_id = $1`,
    [userId, locations, newXp, levelFromXp(newXp)]
  );
}

/** Aplica os efeitos de CONCLUIR uma tarefa no progresso. */
export async function onTaskCompleted(client: PoolClient, userId: string): Promise<void> {
  const progress = await ensureProgress(client, userId);
  const newXp = progress.experience_points + XP_PER_COMPLETE;
  const streak = applyStreakOnCompletion({
    currentStreak: progress.current_streak,
    bestStreak: progress.best_streak,
    lastActivity: progress.last_activity,
  });

  await client.query(
    `UPDATE user_progress
        SET total_tasks_completed = total_tasks_completed + 1,
            current_streak = $2,
            best_streak = $3,
            experience_points = $4,
            level = $5,
            last_activity = now(),
            updated_at = now()
      WHERE user_id = $1`,
    [userId, streak.currentStreak, streak.bestStreak, newXp, levelFromXp(newXp)]
  );
}

/** Recalcula total_locations (usado após update/delete de tarefa). */
export async function recalcLocations(client: PoolClient, userId: string): Promise<void> {
  const locations = await countLocations(client, userId);
  await client.query(
    `UPDATE user_progress
        SET total_locations = $2, updated_at = now()
      WHERE user_id = $1`,
    [userId, locations]
  );
}
