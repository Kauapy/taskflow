import { Task, UserProgress } from './types';

export interface WeeklyData {
  week: string;
  tasksCreated: number;
  tasksCompleted: number;
}

export interface MonthlyData {
  month: string;
  tasksCreated: number;
  tasksCompleted: number;
}

export interface AnalyticsData {
  weeklyProgress: WeeklyData[];
  monthlyProgress: MonthlyData[];
  currentStreak: number;
  bestStreak: number;
  averageCompletionTime: number; // em horas
  productivityScore: number;     // tarefas completadas / criadas * 100
  totalTasks: number;
  completedTasks: number;
}

/**
 * Calcula métricas de produtividade a partir das tarefas e progresso.
 * Função pura: aceita `now` como parâmetro para ser determinística em testes.
 */
export function calculateAnalytics(
  tasks: Task[],
  progress: UserProgress | null,
  now: Date = new Date()
): AnalyticsData | null {
  if (!tasks.length) return null;

  // Dados semanais (últimas 8 semanas, janela móvel)
  const weeklyData: WeeklyData[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });

    weeklyData.push({
      week: weekStart.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      tasksCreated: weekTasks.length,
      tasksCompleted: weekTasks.filter(t => t.completed).length,
    });
  }

  // Dados mensais (últimos 6 meses)
  const monthlyData: MonthlyData[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

    const monthTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= monthStart && taskDate <= monthEnd;
    });

    monthlyData.push({
      month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      tasksCreated: monthTasks.length,
      tasksCompleted: monthTasks.filter(t => t.completed).length,
    });
  }

  // Tempo médio de conclusão (em horas)
  const completedWithTime = tasks.filter(t => t.completed && t.completed_at);
  const averageCompletionTime = completedWithTime.length > 0
    ? completedWithTime.reduce((acc, task) => {
        const created = new Date(task.created_at).getTime();
        const completed = new Date(task.completed_at!).getTime();
        return acc + (completed - created);
      }, 0) / completedWithTime.length / (1000 * 60 * 60)
    : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const productivityScore = totalTasks > 0
    ? (completedTasks / totalTasks) * 100
    : 0;

  return {
    weeklyProgress: weeklyData,
    monthlyProgress: monthlyData,
    currentStreak: progress?.current_streak ?? 0,
    bestStreak: progress?.best_streak ?? 0,
    averageCompletionTime,
    productivityScore,
    totalTasks,
    completedTasks,
  };
}
