/**
 * Authentication Context for JWT Token Management
 * 
 * This module provides authentication context, hooks, and utilities
 * for managing JWT tokens and user authentication state.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, UserInfo, UserLoginRequest } from '@/lib/api';

/**
 * Authentication state interface
 */
interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

/**
 * Authentication context interface
 */
interface AuthContextType extends AuthState {
  login: (credentials: UserLoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string, user: UserInfo) => void;
}

/**
 * Token storage keys
 */
const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_INFO: 'auth_user_info',
} as const;

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Initial authentication state
 */
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
};

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  /**
   * Clear authentication data from localStorage
   */
  const clearAuthStorage = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_INFO);
  };

  /**
   * Load authentication state from localStorage on mount
   */
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
        const userInfoStr = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_INFO);

        if (accessToken && refreshToken && userInfoStr) {
          const userInfo: UserInfo = JSON.parse(userInfoStr);
          
          setAuthState({
            isAuthenticated: true,
            user: userInfo,
            accessToken,
            refreshToken,
            isLoading: false,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear potentially corrupted data
        clearAuthStorage();
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  /**
   * Save authentication data to localStorage
   */
  const saveAuthStorage = (accessToken: string, refreshToken: string, user: UserInfo) => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.USER_INFO, JSON.stringify(user));
  };

  /**
   * Set authentication tokens and user info
   */
  const setTokens = (accessToken: string, refreshToken: string, user: UserInfo) => {
    saveAuthStorage(accessToken, refreshToken, user);
    setAuthState({
      isAuthenticated: true,
      user,
      accessToken,
      refreshToken,
      isLoading: false,
    });
  };

  /**
   * Login user with credentials
   */
  const login = async (credentials: UserLoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await authApi.login(credentials);
      
      // Set tokens and user info
      setTokens(response.access_token, response.refresh_token, response.user);

      return { success: true };
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = apiError.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user and clear authentication state
   */
  const logout = () => {
    clearAuthStorage();
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    });
  };

  /**
   * Refresh access token using refresh token
   * Note: This would require a refresh endpoint on the backend
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      // TODO: Implement refresh token endpoint when available
      // For now, just return false to indicate refresh failed
      console.warn('Token refresh not yet implemented');
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return false;
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAccessToken,
    setTokens,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get user information
 */
export function useUser(): UserInfo | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get authentication loading state
 */
export function useAuthLoading(): boolean {
  const { isLoading } = useAuth();
  return isLoading;
}