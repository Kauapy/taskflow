import { Task, UserProgress } from './supabase';

export type OnboardingStepId =
  | 'first-task'
  | 'complete-task'
  | 'streak-3'
  | 'xp-100'
  | 'share-task';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  /** Para onde o usuário deve ir quando clicar no item ainda pendente. */
  cta: 'tasks' | 'shared' | 'analytics';
  done: boolean;
}

/**
 * Calcula o estado dos 5 "Primeiros passos" a partir de progresso + tarefas.
 * Função pura — fácil de testar.
 */
export function computeOnboarding(
  progress: UserProgress | null,
  tasks: Task[]
): OnboardingStep[] {
  const created = progress?.total_tasks_created ?? 0;
  const completed = progress?.total_tasks_completed ?? 0;
  const bestStreak = progress?.best_streak ?? 0;
  const xp = progress?.experience_points ?? 0;
  const sharedSome = tasks.some(t => (t.shared_with?.length ?? 0) > 0);

  return [
    {
      id: 'first-task',
      title: 'Crie sua primeira tarefa',
      description: 'Comece sua jornada de produtividade',
      cta: 'tasks',
      done: created > 0 || tasks.length > 0,
    },
    {
      id: 'complete-task',
      title: 'Conclua uma tarefa',
      description: 'Marque uma tarefa como feita',
      cta: 'tasks',
      done: completed > 0,
    },
    {
      id: 'streak-3',
      title: 'Sequência de 3 dias',
      description: 'Mantenha um ritmo consistente',
      cta: 'tasks',
      done: bestStreak >= 3,
    },
    {
      id: 'xp-100',
      title: 'Ganhe 100 XP',
      description: 'Acumule pontos completando tarefas',
      cta: 'tasks',
      done: xp >= 100,
    },
    {
      id: 'share-task',
      title: 'Compartilhe uma tarefa',
      description: 'Por e-mail ou link público',
      cta: 'shared',
      done: sharedSome,
    },
  ];
}

export function onboardingCompletion(steps: OnboardingStep[]): {
  done: number;
  total: number;
  percentage: number;
} {
  const total = steps.length;
  const done = steps.filter(s => s.done).length;
  return {
    done,
    total,
    percentage: total === 0 ? 0 : (done / total) * 100,
  };
}
