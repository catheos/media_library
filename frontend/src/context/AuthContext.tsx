import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userService, ApiException } from '@/api';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  current_user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  is_authenticated: boolean;
  is_loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [current_user, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [is_loading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const user = await userService.getProfile();
        setToken(storedToken);
        setCurrentUser(user);
      } catch (error) {
        // 401/403 handled automatically by api()
        // 500..., use localstorage
        if (!(error instanceof ApiException && (error.status === 401 || error.status === 403))) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setToken(storedToken);
            setCurrentUser(JSON.parse(storedUser));
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setCurrentUser(newUser);
    window.location.href = `/users/${newUser.id}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    window.location.href = '/users/login';
  };

  const is_authenticated = !!token && !!current_user;

  return (
    <AuthContext.Provider value={{ current_user, token, login, logout, is_authenticated, is_loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};