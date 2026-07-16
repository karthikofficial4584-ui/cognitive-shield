import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/storage';
import { authService, setAuthToken, apiClient, userService } from '../services/api';
import { router } from 'expo-router';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
  accessToken: string | null;
  login: (username: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);



export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const restoreSession = async () => {
    try {
      setIsLoading(true);
      const storedToken = await getToken();
      
      if (storedToken) {
        setAuthToken(storedToken);
        setAccessToken(storedToken);
        
        // Validate token using GET /auth/me
        try {
          const userProfile = await userService.getProfile();
          if (userProfile) {
            setCurrentUser(userProfile);
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid session');
          }
        } catch (e) {
          console.log('Session restore failed or expired:', e);
          await logout();
        }
      } else {
        // No token
        setAuthToken(null);
        setAccessToken(null);
        setIsAuthenticated(false);
        router.replace('/login');
      }
    } catch (e) {
      console.error('Storage error:', e);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (username: string, password?: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(username, password);
      
      const token = response.access_token || response.token;
      if (token) {
        await setToken(token);
        setAuthToken(token);
        setAccessToken(token);
        
        // Fetch user right after login
        const userProfile = await userService.getProfile();
        setCurrentUser(userProfile);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    try {
      setIsLoading(true);
      // Direct call since there is no register in api.ts
      await apiClient.post('/auth/register', { name, email, password, role: role || 'Developer' });
      // Auto-login after registration
      await login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setAuthToken(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      setCurrentUser(null);
      await authService.logout().catch(() => {});
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        currentUser,
        accessToken,
        login,
        register,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
