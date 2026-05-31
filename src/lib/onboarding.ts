import { Task, UserProgress } from './types';

export type OnboardingSlotId =
  | 'create'
  | 'complete'
  | 'streak'
  | 'xp'
  | 'share'
  | 'locations';
export type OnboardingCta = 'tasks' | 'shared' | 'analytics';

interface SlotMission {
  id: string;
  title: string;
  description: string;
  target: number;
}

interface SlotDefinition {
  id: OnboardingSlotId;
  cta: OnboardingCta;
  /** Lê o valor atual do progresso/tarefas para esse slot. */
  getCurrent: (progress: UserProgress | null, tasks: Task[]) => number;
  /** Missões em ordem crescente de dificuldade. */
  chain: SlotMission[];
}

const SLOTS: SlotDefinition[] = [
  {
    id: 'create',
    cta: 'tasks',
    getCurrent: (p, t) => Math.max(p?.total_tasks_created ?? 0, t.length),
    chain: [
      { id: 'create-1',   title: 'Crie sua primeira tarefa', description: 'Comece sua jornada',           target: 1 },
      { id: 'create-5',   title: 'Crie 5 tarefas',           description: 'Acumule um bom volume',         target: 5 },
      { id: 'create-25',  title: 'Crie 25 tarefas',          description: 'Organizador frequente',         target: 25 },
      { id: 'create-100', title: 'Crie 100 tarefas',         description: 'Mestre da organização',         target: 100 },
    ],
  },
  {
    id: 'complete',
    cta: 'tasks',
    getCurrent: (p) => p?.total_tasks_completed ?? 0,
    chain: [
      { id: 'complete-1',   title: 'Conclua uma tarefa',   description: 'Marque como feita',         target: 1 },
      { id: 'complete-10',  title: 'Conclua 10 tarefas',   description: 'Mantenha o ritmo',          target: 10 },
      { id: 'complete-50',  title: 'Conclua 50 tarefas',   description: 'Você está pegando o jeito', target: 50 },
      { id: 'complete-200', title: 'Conclua 200 tarefas',  description: 'Produtividade implacável',  target: 200 },
    ],
  },
  {
    id: 'streak',
    cta: 'tasks',
    getCurrent: (p) => p?.best_streak ?? 0,
    chain: [
      { id: 'streak-3',   title: 'Sequência de 3 dias',   description: 'Mantenha consistência',  target: 3 },
      { id: 'streak-7',   title: 'Sequência de 7 dias',   description: 'Uma semana imparável',   target: 7 },
      { id: 'streak-30',  title: 'Sequência de 30 dias',  description: 'Hábito consolidado',     target: 30 },
      { id: 'streak-100', title: 'Sequência de 100 dias', description: 'Lenda viva',             target: 100 },
    ],
  },
  {
    id: 'xp',
    cta: 'tasks',
    getCurrent: (p) => p?.experience_points ?? 0,
    chain: [
      { id: 'xp-100',    title: 'Ganhe 100 XP',    description: 'Primeiros pontos',  target: 100 },
      { id: 'xp-500',    title: 'Ganhe 500 XP',    description: 'Bom progresso',     target: 500 },
      { id: 'xp-2000',   title: 'Ganhe 2.000 XP',  description: 'Veterano',          target: 2000 },
      { id: 'xp-10000',  title: 'Ganhe 10.000 XP', description: 'Inalcançável',      target: 10000 },
    ],
  },
  {
    id: 'share',
    cta: 'shared',
    getCurrent: (_p, tasks) => tasks.filter(t => (t.shared_with?.length ?? 0) > 0).length,
    chain: [
      { id: 'share-1', title: 'Compartilhe uma tarefa', description: 'Por e-mail ou link',  target: 1 },
      { id: 'share-3', title: 'Compartilhe 3 tarefas',  description: 'Colabore com o time', target: 3 },
      { id: 'share-10', title: 'Compartilhe 10 tarefas', description: 'Trabalho em equipe', target: 10 },
    ],
  },
  {
    id: 'locations',
    cta: 'tasks',
    getCurrent: (p) => p?.total_locations ?? 0,
    chain: [
      { id: 'locations-3',  title: 'Use 3 locais diferentes',  description: 'Varie seus contextos',    target: 3 },
      { id: 'locations-10', title: 'Use 10 locais diferentes', description: 'Explorador',               target: 10 },
      { id: 'locations-25', title: 'Use 25 locais diferentes', description: 'Viajante incansável',      target: 25 },
    ],
  },
];

export interface OnboardingStep {
  id: string;
  slotId: OnboardingSlotId;
  title: string;
  description: string;
  cta: OnboardingCta;
  current: number;
  target: number;
  /** Posição da missão dentro da cadeia (1-based). */
  level: number;
  /** Quantas missões existem no slot total. */
  total: number;
  /** O usuário concluiu TODAS as missões deste slot? */
  isMaxed: boolean;
}

/**
 * Calcula a missão ativa de cada slot. Quando o usuário atinge o target da
 * missão atual, a próxima da cadeia entra automaticamente no lugar. Se o
 * slot inteiro foi vencido, a última missão é retornada com isMaxed=true.
 */
export function computeOnboarding(
  progress: UserProgress | null,
  tasks: Task[]
): OnboardingStep[] {
  return SLOTS.map(slot => {
    const current = slot.getCurrent(progress, tasks);
    const total = slot.chain.length;

    // Primeira missão cujo target ainda NÃO foi atingido
    const activeIdx = slot.chain.findIndex(m => current < m.target);

    if (activeIdx === -1) {
      // Cadeia inteira completa
      const last = slot.chain[total - 1];
      return {
        id: last.id,
        slotId: slot.id,
        title: last.title,
        description: last.description,
        cta: slot.cta,
        current,
        target: last.target,
        level: total,
        total,
        isMaxed: true,
      };
    }

    const mission = slot.chain[activeIdx];
    return {
      id: mission.id,
      slotId: slot.id,
      title: mission.title,
      description: mission.description,
      cta: slot.cta,
      current,
      target: mission.target,
      level: activeIdx + 1,
      total,
      isMaxed: false,
    };
  });
}

/**
 * Resumo do progresso geral: quantos slots foram totalmente maxados.
 */
export function onboardingCompletion(steps: OnboardingStep[]): {
  maxed: number;
  total: number;
  percentage: number;
} {
  const total = steps.length;
  const maxed = steps.filter(s => s.isMaxed).length;
  return {
    maxed,
    total,
    percentage: total === 0 ? 0 : (maxed / total) * 100,
  };
}
