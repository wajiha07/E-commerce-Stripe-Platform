import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, getRefreshToken, setTokens } from '../lib/api';
import { getGuestId } from '../lib/guest';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'MANAGER' | 'SUPPORT';
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isStaff: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api<User>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (getRefreshToken() || localStorage.getItem('lunaire_access')) {
        await refreshUser();
      }
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        auth: false,
      },
    );
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    try {
      await api('/cart/merge', {
        method: 'POST',
        body: JSON.stringify({ guestId: getGuestId() }),
      });
    } catch {
      /* ignore */
    }
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          auth: false,
        },
      );
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
        auth: false,
      });
    } finally {
      setTokens(null, null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isStaff: !!user && ['ADMIN', 'MANAGER', 'SUPPORT'].includes(user.role),
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
