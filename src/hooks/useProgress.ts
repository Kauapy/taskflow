import { useState, useEffect, useCallback } from 'react';
import { supabase, UserProgress } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProgress = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProgress(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    fetchProgress();

    const channel = supabase
      .channel(`progress_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProgress]);

  return { progress, loading, refetch: fetchProgress };
};
