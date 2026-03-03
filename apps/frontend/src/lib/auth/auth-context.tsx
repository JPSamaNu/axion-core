'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { UserDto, LoginRequest, LoginResponse } from '@axion/types';
import { HttpClient, tokenStorage } from '../api';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  httpClient: HttpClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
  apiBaseUrl: string;
  tenantId: string | null;
}

export function AuthProvider({ children, apiBaseUrl, tenantId }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Rehydrate from storage after mount (avoids hydration mismatch)
  useEffect(() => {
    const storedUser = tokenStorage.getUser();
    const storedToken = tokenStorage.getAccessToken();
    if (storedUser && storedToken) {
      document.cookie = 'axion_session=1; path=/; SameSite=Lax';
      setState({ user: storedUser, isAuthenticated: true, isLoading: false });
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const httpClient = useMemo(
    () =>
      new HttpClient({
        baseUrl: apiBaseUrl,
        tenantId,
        onTokenRefreshed: (accessToken, refreshToken) => {
          tokenStorage.setAccessToken(accessToken);
          tokenStorage.setRefreshToken(refreshToken);
        },
        onRefreshFailed: () => {
          tokenStorage.clear();
          setState({ user: null, isAuthenticated: false, isLoading: false });
        },
      }),
    [apiBaseUrl, tenantId],
  );

  useEffect(() => {
    httpClient.setTenantId(tenantId);
  }, [tenantId, httpClient]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await httpClient.post<LoginResponse>(
          '/auth/login',
          credentials,
          { skipAuth: true },
        );
        tokenStorage.setAccessToken(response.accessToken);
        tokenStorage.setRefreshToken(response.refreshToken);
        tokenStorage.setUser(response.user);
        // Store tenantId for subsequent requests
        if (response.user.tenantId) {
          localStorage.setItem('axion_tenant_id', response.user.tenantId);
          httpClient.setTenantId(response.user.tenantId);
        }
        // Set session cookie for Next.js middleware
        document.cookie = 'axion_session=1; path=/; SameSite=Lax';
        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        throw error;
      }
    },
    [httpClient],
  );

  const logout = useCallback(async () => {
    try {
      await httpClient.post('/auth/logout');
    } catch {
      // Logout even if server call fails
    } finally {
      tokenStorage.clear();
      localStorage.removeItem('axion_tenant_id');
      // Clear session cookie
      document.cookie = 'axion_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, [httpClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, httpClient }),
    [state, login, logout, httpClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
