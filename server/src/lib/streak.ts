/**
 * Lógica de sequência (streak). Espelha src/lib/streak.ts do frontend —
 * são pacotes separados, então a duplicação é intencional. Função pura,
 * fácil de testar.
 *
 * Regra ao concluir uma tarefa, comparando o DIA (não a hora) da última
 * atividade com hoje:
 *   - sem atividade prévia → 1
 *   - mesmo dia           → mantém
 *   - dia seguinte (gap 1) → +1
 *   - gap > 1             → reseta para 1
 * bestStreak nunca regride.
 */
export interface StreakInput {
  currentStreak: number;
  bestStreak: number;
  lastActivity: string | Date | null;
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
}

export function applyStreakOnCompletion(
  state: StreakInput,
  now: Date = new Date()
): StreakResult {
  // currentStreak 0 = nunca concluiu nada. A primeira conclusão SEMPRE
  // inicia o streak em 1, mesmo que last_activity já seja hoje (o usuário
  // pode ter criado a tarefa hoje, o que mexe em last_activity).
  if (state.currentStreak === 0) {
    return { currentStreak: 1, bestStreak: Math.max(state.bestStreak, 1) };
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  let current = state.currentStreak;
  if (state.lastActivity) {
    const lastDay = new Date(state.lastActivity);
    lastDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86400000);

    if (diffDays === 0) {
      // mesmo dia — sem mudança
    } else if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }
  } else {
    current = 1;
  }

  return {
    currentStreak: current,
    bestStreak: Math.max(state.bestStreak, current),
  };
}
