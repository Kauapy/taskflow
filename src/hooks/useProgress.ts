import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { UserProgress } from '../lib/types';
import { useAuth } from './useAuth';

const POLL_INTERVAL_MS = 5000;

/**
 * Hook de progresso/gamificação.
 *
 * Antes usava Supabase Realtime (postgres_changes) para refletir XP/streak
 * ao vivo. Como o backend próprio não tem WebSocket, usamos POLLING: a cada
 * 5s buscamos GET /progress. Simples e suficiente para o caso (poucos dados,
 * 1 usuário por sessão). `refetch` permite atualização imediata após mutações.
 */
export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      const { progress } = await apiFetch<{ progress: UserProgress }>('GET', '/progress');
      setProgress(progress);
    } catch {
      // transitório — mantém o último valor conhecido
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    fetchProgress();

    // Polling: substitui o canal Realtime do Supabase.
    timerRef.current = setInterval(fetchProgress, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, fetchProgress]);

  return { progress, loading, refetch: fetchProgress };
};
