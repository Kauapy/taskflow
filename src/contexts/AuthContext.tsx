import { createContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, getToken, setToken, clearToken, ApiError } from '../lib/api';
import { AuthUser } from '../lib/types';

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Ao montar: se há token salvo, restaura a sessão via /auth/me.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: AuthUser }>('GET', '/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => {
        // token inválido/expirado → limpa
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { token, user } = await apiFetch<AuthResponse>('POST', '/auth/login', { email, password });
      setToken(token);
      setUser(user);
      return { error: null };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha ao entrar. Tente novamente.';
      return { error: message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { token, user } = await apiFetch<AuthResponse>('POST', '/auth/signup', { email, password });
      setToken(token);
      setUser(user);
      return { error: null };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao criar conta. Tente novamente.';
      return { error: message };
    }
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
