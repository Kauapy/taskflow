import { useState, useEffect } from 'react';
import { supabase, Task, UserProgress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WeeklyData {
  week: string;
  tasksCreated: number;
  tasksCompleted: number;
}

interface MonthlyData {
  month: string;
  tasksCreated: number;
  tasksCompleted: number;
}

interface AnalyticsData {
  weeklyProgress: WeeklyData[];
  monthlyProgress: MonthlyData[];
  currentStreak: number;
  bestStreak: number;
  averageCompletionTime: number; // em horas
  productivityScore: number; // tarefas completadas / criadas * 100
  totalTasks: number;
  completedTasks: number;
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const calculateAnalytics = (tasks: Task[], progress: UserProgress | null) => {
    if (!tasks.length) return null;

    // Dados semanais (últimas 8 semanas)
    const weeklyData: WeeklyData[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
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
        tasksCompleted: weekTasks.filter(t => t.completed).length
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
        tasksCompleted: monthTasks.filter(t => t.completed).length
      });
    }

    // Tempo médio de conclusão
    const completedTasks = tasks.filter(t => t.completed && t.completed_at);
    const averageTime = completedTasks.length > 0
      ? completedTasks.reduce((acc, task) => {
          const created = new Date(task.created_at).getTime();
          const completed = new Date(task.completed_at!).getTime();
          return acc + (completed - created);
        }, 0) / completedTasks.length / (1000 * 60 * 60) // em horas
      : 0;

    // Score de produtividade
    const totalCreated = tasks.length;
    const totalCompleted = tasks.filter(t => t.completed).length;
    const productivityScore = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0;

    return {
      weeklyProgress: weeklyData,
      monthlyProgress: monthlyData,
      currentStreak: progress?.current_streak || 0,
      bestStreak: progress?.best_streak || 0,
      averageCompletionTime: averageTime,
      productivityScore,
      totalTasks: totalCreated,
      completedTasks: totalCompleted
    };
  };

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);

    // Buscar todas as tarefas do usuário
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Buscar progresso
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (progressError) {
      console.error('Erro ao buscar progresso:', progressError);
    }

    if (!tasksError && tasks) {
      const analyticsData = calculateAnalytics(tasks, progress);
      setAnalytics(analyticsData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
};