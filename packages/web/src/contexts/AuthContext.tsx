import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserResponseDTO } from '@saas/shared';
import { api, getApiErrorMessage, isUnauthorizedError } from '@/lib/api';

interface AuthContextType {
  user: UserResponseDTO | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  bootstrapError: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const clearSession = () => {
    setUser(null);
    setBootstrapError(null);
  };

  const loadProfile = async () => {
    const res = await api.get<UserResponseDTO>('/profile/me');
    setUser(res.data);
    setBootstrapError(null);
  };

  const refreshProfile = async () => {
    try {
      await loadProfile();
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
    loadProfile()
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          // Sem sessão ativa — estado normal, não é erro
          clearSession();
          return;
        }

        setBootstrapError(
          getApiErrorMessage(error, 'Nao foi possivel carregar sua sessao agora.'),
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Cookie foi setado pelo servidor no login — só precisamos carregar o perfil
  const login = async () => {
    try {
      await loadProfile();
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const logout = () => {
    void api.post('/auth/logout').catch(() => {});
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, bootstrapError, refreshProfile }}
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
