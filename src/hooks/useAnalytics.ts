import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAnalytics, AnalyticsData } from '../lib/analytics';
import { useAuth } from './useAuth';

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (progressError) {
      console.error('Erro ao buscar progresso:', progressError);
    }

    if (!tasksError && tasks) {
      setAnalytics(calculateAnalytics(tasks, progress));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics,
  };
};
