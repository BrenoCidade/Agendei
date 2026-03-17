import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserResponseDTO } from '@saas/shared';
import { api } from '@/lib/api';

interface AuthContextType {
  user: UserResponseDTO | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('access_token'));

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get<UserResponseDTO>('/profile/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('access_token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    const res = await api.get<UserResponseDTO>('/profile/me', {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    setUser(res.data);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
