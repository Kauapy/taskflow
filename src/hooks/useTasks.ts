import { useState, useEffect, useCallback } from 'react';
import { apiFetch, ApiError } from '../lib/api';
import { Task, TaskShareLink } from '../lib/types';
import { useAuth } from './useAuth';

/**
 * Hook de tarefas. Fala com o backend REST próprio (antes era Supabase).
 * Toda a lógica de XP/streak/locais agora roda no servidor — aqui só
 * disparamos as operações e atualizamos o estado local.
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { tasks } = await apiFetch<{ tasks: Task[] }>('GET', '/tasks');
      setTasks(tasks);
    } catch {
      // silencioso — UI mostra lista vazia; erros de rede são transitórios
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (
    title: string,
    urgency: 'baixa' | 'media' | 'alta',
    location: string,
    category: string = '',
    dueDate?: string,
    attachments: string[] = []
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      const { task } = await apiFetch<{ task: Task }>('POST', '/tasks', {
        title,
        urgency,
        location,
        category,
        due_date: dueDate ?? null,
        attachments,
      });
      setTasks(prev => [task, ...prev]);
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: err instanceof ApiError ? err.message : 'Erro ao criar tarefa.' };
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const { task } = await apiFetch<{ task: Task }>('POST', `/tasks/${taskId}/complete`);
      setTasks(prev => prev.map(t => (t.id === taskId ? task : t)));
    } catch {
      // ignora; refetch externo pode reconciliar
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiFetch('DELETE', `/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {
      // ignora
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'urgency' | 'location' | 'category' | 'due_date' | 'attachments'>>
  ) => {
    try {
      const { task } = await apiFetch<{ task: Task }>('PATCH', `/tasks/${taskId}`, updates);
      setTasks(prev => prev.map(t => (t.id === taskId ? task : t)));
    } catch {
      // ignora
    }
  };

  const shareTask = async (
    taskId: string,
    email: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      await apiFetch('POST', '/shares', { taskId, email });
      // Mantém o array local em dia (o backend já atualizou no banco).
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, shared_with: [...(t.shared_with ?? []), '__shared__'] } : t
      ));
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: err instanceof ApiError ? err.message : 'Erro ao compartilhar.' };
    }
  };

  const createShareLink = async (
    taskId: string,
    expiresInDays?: number
  ): Promise<{ success: boolean; link?: TaskShareLink; url?: string; errorMessage?: string }> => {
    try {
      const { link } = await apiFetch<{ link: TaskShareLink }>('POST', '/share-links', {
        taskId,
        ...(expiresInDays ? { expiresInDays } : {}),
      });
      const url = `${window.location.origin}/shared/${link.token}`;
      return { success: true, link, url };
    } catch (err) {
      return { success: false, errorMessage: err instanceof ApiError ? err.message : 'Erro ao gerar link.' };
    }
  };

  const listShareLinks = async (taskId: string): Promise<TaskShareLink[]> => {
    try {
      const { links } = await apiFetch<{ links: TaskShareLink[] }>(
        'GET',
        `/share-links?taskId=${encodeURIComponent(taskId)}`
      );
      return links;
    } catch {
      return [];
    }
  };

  const revokeShareLink = async (
    linkId: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      await apiFetch('POST', `/share-links/${linkId}/revoke`);
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: err instanceof ApiError ? err.message : 'Erro ao revogar.' };
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
    createShareLink,
    listShareLinks,
    revokeShareLink,
    refetch: fetchTasks,
  };
};
