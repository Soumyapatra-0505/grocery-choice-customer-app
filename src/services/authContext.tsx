/**
 * Grocery Choice Customer App - Authentication Context & Provider
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { storageService } from '@/storage/storage';
import { authApi } from '@/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load persisted session on app start
  useEffect(() => {
    let isMounted = true;

    async function loadStoredAuth() {
      try {
        const storedToken = await storageService.getAuthToken();
        const storedUser = await storageService.getUserProfile();

        if (isMounted) {
          if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
          }
        }
      } catch {
        // Keep initial state
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStoredAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await storageService.setAuthToken(newToken);
    await storageService.setUserProfile(newUser);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await storageService.removeAuthToken();
    await storageService.removeUserProfile();
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const refreshed = await authApi.getProfile();
      setUser(refreshed);
      await storageService.setUserProfile(refreshed);
    } catch {
      // If unauthorized, log out
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
