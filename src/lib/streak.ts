export interface StreakInput {
  currentStreak: number;
  bestStreak: number;
  lastActivity: string | null;
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
}

/**
 * Decide o novo streak quando uma tarefa é completada.
 * Compara o dia (não a hora) da última atividade com o de `now`.
 *
 * - Sem atividade prévia → começa em 1.
 * - Mesmo dia → mantém streak.
 * - Dia imediatamente seguinte → +1.
 * - Mais de 1 dia de gap → reseta para 1.
 *
 * `bestStreak` é sempre o máximo entre o anterior e o `currentStreak` novo.
 */
export function applyStreakOnCompletion(
  state: StreakInput,
  now: Date = new Date()
): StreakResult {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  let current = state.currentStreak;
  if (state.lastActivity) {
    const lastDay = new Date(state.lastActivity);
    lastDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (today.getTime() - lastDay.getTime()) / 86400000
    );

    if (diffDays === 0) {
      // mesma janela diária — sem mudança
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
