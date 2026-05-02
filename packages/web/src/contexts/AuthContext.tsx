import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserResponseDTO } from '@saas/shared';
import { api, getApiErrorMessage, isUnauthorizedError } from '@/lib/api';

interface AuthContextType {
  user: UserResponseDTO | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  bootstrapError: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('access_token'));
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const clearSession = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setBootstrapError(null);
  };

  const loadProfile = async (authToken: string) => {
    const res = await api.get<UserResponseDTO>('/profile/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    setUser(res.data);
    setBootstrapError(null);
  };

  const refreshProfile = async () => {
    if (!token) {
      return;
    }

    try {
      await loadProfile(token);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession();
        return;
      }

      setBootstrapError(
        getApiErrorMessage(error, 'Nao foi possivel carregar sua sessao agora.'),
      );
    }
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    loadProfile(token)
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          clearSession();
          return;
        }

        setBootstrapError(
          getApiErrorMessage(error, 'Nao foi possivel carregar sua sessao agora.'),
        );
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);

    try {
      await loadProfile(newToken);
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoading, bootstrapError, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
