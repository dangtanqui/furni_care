import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getMe } from '../api/auth';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isCS: boolean;
  isTechnician: boolean;
  isLeader: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      getMe()
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          // Token is invalid or expired
          logout();
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isCS: user?.role === 'cs',
      isTechnician: user?.role === 'technician',
      isLeader: user?.role === 'leader',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

