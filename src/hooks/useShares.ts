import { useState, useEffect, useCallback } from 'react';
import { supabase, IncomingShare } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

    const { data, error } = await supabase.rpc('get_incoming_shares');

    if (!error && data) {
      setIncoming(data as IncomingShare[]);
    } else if (error) {
      console.error('Erro ao buscar compartilhamentos recebidos:', error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const acceptShare = async (shareId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    const { error } = await supabase
      .from('task_shares')
      .update({ status: 'accepted' })
      .eq('id', shareId);

    if (error) {
      return { success: false, errorMessage: error.message };
    }
    await fetchShares();
    return { success: true };
  };

  const declineShare = async (shareId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    const { error } = await supabase
      .from('task_shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      return { success: false, errorMessage: error.message };
    }
    await fetchShares();
    return { success: true };
  };

  return {
    incoming,
    loading,
    acceptShare,
    declineShare,
    refetch: fetchShares,
  };
};
