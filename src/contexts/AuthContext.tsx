import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Garantir que o registro de progresso foi criado
      if (data.user) {
        // Aguardar um pouco para garantir que o trigger foi executado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar se o registro já existe
        const { data: existingProgress, error: fetchError } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Erro ao buscar progresso:', fetchError);
          return { error: `Erro ao criar perfil de usuário: ${fetchError.message}` };
        }

        // Se não existe, criar manualmente
        if (!existingProgress) {
          const { error: progressError } = await supabase
            .from('user_progress')
            .insert([{ user_id: data.user.id }]);

          if (progressError) {
            console.error('Erro ao inserir progresso:', progressError);
            return { error: `Erro ao criar perfil de usuário: ${progressError.message}` };
          }
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Erro no signup:', err);
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
