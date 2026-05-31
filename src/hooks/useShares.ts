import { useState, useEffect, useCallback } from 'react';
import { apiFetch, ApiError } from '../lib/api';
import { IncomingShare } from '../lib/types';
import { useAuth } from './useAuth';

export const useShares = () => {
  const [incoming, setIncoming] = useState<IncomingShare[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchShares = useCallback(async () => {
    if (!user) {
      setIncoming([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { incoming } = await apiFetch<{ incoming: IncomingShare[] }>('GET', '/shares/incoming');
      setIncoming(incoming);
    } catch {
      // transitório
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const acceptShare = async (shareId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      await apiFetch('POST', `/shares/${shareId}/accept`);
      await fetchShares();
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: err instanceof ApiError ? err.message : 'Erro ao aceitar.' };
    }
  };

  const declineShare = async (shareId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      await apiFetch('DELETE', `/shares/${shareId}`);
      await fetchShares();
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: err instanceof ApiError ? err.message : 'Erro ao recusar.' };
    }
  };

  return {
    incoming,
    loading,
    acceptShare,
    declineShare,
    refetch: fetchShares,
  };
};
