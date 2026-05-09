import { useState, useEffect } from 'react';
import { supabase, Task } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const recalcLocations = async () => {
    if (!user) return;
    const { data: tasks } = await supabase
      .from('tasks')
      .select('location')
      .eq('user_id', user.id);
    if (tasks) {
      const uniqueLocations = new Set(
        tasks.map(t => t.location).filter((l): l is string => Boolean(l))
      );
      await supabase
        .from('user_progress')
        .update({
          total_locations: uniqueLocations.size,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }
  };

  const addTask = async (
    title: string,
    urgency: 'baixa' | 'media' | 'alta',
    location: string,
    category: string = '',
    dueDate?: string,
    attachments: string[] = []
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    if (!user) return { success: false, errorMessage: 'Usuário não autenticado.' };

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      title,
      urgency,
      location,
      category,
      due_date: dueDate || null,
      attachments,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      const msg = `[${error.code}] ${error.message} — ${error.details ?? ''}`;
      console.error('ERRO AO CRIAR TAREFA:', msg);
      return { success: false, errorMessage: msg };
    }

    if (data) {
      setTasks(prev => [data, ...prev]);
      await updateProgress('task_created', location);
    }

    return { success: true };
  };

  const completeTask = async (taskId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
      await updateProgress('task_completed');
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await recalcLocations();
    }
  };

  const updateProgress = async (action: 'task_created' | 'task_completed', location?: string) => {
    if (!user || !user.id) return;

    const { data: progress, error: fetchError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao buscar progresso:', fetchError);
      return;
    }
    if (!progress) return;

    const nowIso = new Date().toISOString();
    const updates: Record<string, number | string> = {
      updated_at: nowIso,
      last_activity: nowIso,
    };

    let newXp = progress.experience_points;
    let newCurrentStreak = progress.current_streak;
    let newBestStreak = progress.best_streak;

    if (action === 'task_created') {
      updates.total_tasks_created = progress.total_tasks_created + 1;
      newXp += 10;

      if (location) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('location')
          .eq('user_id', user.id);

        if (tasks) {
          const uniqueLocations = new Set(
            tasks.map(t => t.location).filter((l): l is string => Boolean(l))
          );
          updates.total_locations = uniqueLocations.size;
        }
      }
    } else if (action === 'task_completed') {
      updates.total_tasks_completed = progress.total_tasks_completed + 1;
      newXp += 50;

      // Streak: comparar dia da última atividade vs hoje (timezone local)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const last = progress.last_activity ? new Date(progress.last_activity) : null;
      if (last) {
        const lastDay = new Date(last);
        lastDay.setHours(0, 0, 0, 0);
        const diffDays = Math.round(
          (today.getTime() - lastDay.getTime()) / 86400000
        );

        if (diffDays === 0) {
          // mesma janela diária — sem mudança no streak
        } else if (diffDays === 1) {
          newCurrentStreak += 1;
        } else {
          newCurrentStreak = 1;
        }
      } else {
        newCurrentStreak = 1;
      }
      newBestStreak = Math.max(newBestStreak, newCurrentStreak);
      updates.current_streak = newCurrentStreak;
      updates.best_streak = newBestStreak;
    }

    updates.experience_points = newXp;
    updates.level = Math.floor(newXp / 500) + 1;

    const { error: updateError } = await supabase
      .from('user_progress')
      .update(updates)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar progresso:', updateError);
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'urgency' | 'location' | 'category' | 'due_date' | 'attachments'>>
  ) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
      if ('location' in updates) {
        await recalcLocations();
      }
    }
  };

  const shareTask = async (taskId: string, sharedWithUserId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_shares')
      .insert([{
        task_id: taskId,
        shared_by: user.id,
        shared_with: sharedWithUserId,
        status: 'pending'
      }]);

    if (!error) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await supabase
          .from('tasks')
          .update({ shared_with: [...task.shared_with, sharedWithUserId] })
          .eq('id', taskId);
      }
    }
  };

  return {
    tasks,
    loading,
    addTask,
    completeTask,
    deleteTask,
    updateTask,
    shareTask,
    refetch: fetchTasks,
  };
};
