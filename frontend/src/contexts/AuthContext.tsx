import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getMe } from '../api/auth';
import { ROLES } from '../constants/roles';
import { setUser as setSentryUser } from '../utils/errorTracker';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  isCS: boolean;
  isTechnician: boolean;
  isLeader: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'token';
const TOKEN_EXPIRATION_KEY = 'token_expiration';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Load token and check expiration on mount
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const expiration = localStorage.getItem(TOKEN_EXPIRATION_KEY);
    
    if (!storedToken || !expiration) {
      return null;
    }
    
    // Check if token has expired
    const expirationTime = parseInt(expiration, 10);
    if (Date.now() > expirationTime) {
      // Token expired, remove it
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRATION_KEY);
      return null;
    }
    
    return storedToken;
  });

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRATION_KEY);
    // Note: We don't clear remembered email/password here
    // They will be cleared only if user unchecks "Remember Me"
    setToken(null);
    setUser(null);
    // Clear Sentry user context
    setSentryUser(null);
  };

  useEffect(() => {
    if (token) {
      getMe()
        .then(res => {
          setUser(res.data.user);
          // Set Sentry user context
          setSentryUser(res.data.user);
        })
        .catch(() => {
          // Token is invalid or expired
          logout();
        });
    } else {
      setUser(null);
      setSentryUser(null);
    }
  }, [token]);

  const login = (newToken: string, newUser: User, rememberMe: boolean = false) => {
    // Calculate expiration time
    // If rememberMe is true, token expires in 30 days, otherwise 1 day
    const expirationDays = rememberMe ? 30 : 1;
    const expirationTime = Date.now() + (expirationDays * 24 * 60 * 60 * 1000);
    
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(TOKEN_EXPIRATION_KEY, expirationTime.toString());
    setToken(newToken);
    setUser(newUser);
    // Set Sentry user context
    setSentryUser(newUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isCS: user?.role === ROLES.CS,
      isTechnician: user?.role === ROLES.TECHNICIAN,
      isLeader: user?.role === ROLES.LEADER,
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

