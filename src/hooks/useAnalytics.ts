import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { Task, UserProgress } from '../lib/types';
import { calculateAnalytics, AnalyticsData } from '../lib/analytics';
import { useAuth } from './useAuth';

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ tasks }, { progress }] = await Promise.all([
        apiFetch<{ tasks: Task[] }>('GET', '/tasks'),
        apiFetch<{ progress: UserProgress }>('GET', '/progress'),
      ]);
      setAnalytics(calculateAnalytics(tasks, progress));
    } catch {
      // transitório — mantém o último valor
    } finally {
      setLoading(false);
    }
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
