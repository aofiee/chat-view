'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState } from '@/types/auth';
import { authStorage, refreshAccessToken, isTokenExpired, createUserFromToken, getGoogleAuthUrl, setOAuthState } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mounting to avoid hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for stored tokens and user on mount
  useEffect(() => {
    if (!mounted) return;

    const initializeAuth = async () => {
      // Clear any stale OAuth state on startup (except during OAuth callback)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/callback')) {
        const stateTimestamp = authStorage.getStoredStateTimestamp();
        if (stateTimestamp) {
          const stateAge = Date.now() - parseInt(stateTimestamp);
          const maxAge = 15 * 60 * 1000; // 15 minutes
          if (stateAge > maxAge) {
            authStorage.clearOAuthState();
          }
        }
      }

      const accessToken = authStorage.getAccessToken();
      const refreshToken = authStorage.getRefreshToken();
      const storedUser = authStorage.getUser();

      if (accessToken && refreshToken && storedUser) {
        // Check if access token is expired
        if (isTokenExpired(accessToken)) {
          // Try to refresh the token
          try {
            const refreshResult = await refreshAccessToken(refreshToken);
            if (refreshResult.status.code === 200) {
              const newUser = createUserFromToken(
                refreshResult.data.accessToken,
                refreshResult.data.refreshToken
              );
              
              if (newUser) {
                authStorage.setTokens(
                  refreshResult.data.accessToken,
                  refreshResult.data.refreshToken
                );
                setAuthState({
                  isAuthenticated: true,
                  user: newUser,
                  loading: false,
                  error: null,
                });
                return;
              }
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
          
          // If refresh failed, clear auth
          authStorage.clearAuth();
        } else {
          // Token is still valid
          setAuthState({
            isAuthenticated: true,
            user: storedUser,
            loading: false,
            error: null,
          });
          return;
        }
      }

      // No valid auth found
      setAuthState(prev => ({ ...prev, loading: false }));
    };

    initializeAuth();
  }, [mounted]);

  const login = () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // Use backend-generated OAuth URL
    getGoogleAuthUrl().then((authUrl) => {
      // Extract state from URL to store it
      try {
        const url = new URL(authUrl);
        const state = url.searchParams.get('state');
        if (state) {
          setOAuthState(state);
        }
      } catch (error) {
        console.error('Failed to extract state from OAuth URL:', error);
      }
      
      window.location.href = authUrl;
    }).catch((error) => {
      console.error('Failed to get OAuth URL:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to initiate login. Please try again.',
        loading: false
      }));
    });
  };

  const logout = () => {
    authStorage.clearAuth();
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const setTokens = (accessToken: string, refreshToken: string) => {
    const user = createUserFromToken(accessToken, refreshToken);
    if (user) {
      authStorage.setTokens(accessToken, refreshToken);
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
    } else {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to parse user information from token',
      }));
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const result = await refreshAccessToken(refreshToken);
      if (result.status.code === 200) {
        setTokens(result.data.accessToken, result.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    setTokens,
    refreshTokens,
  };

  // Don't render children until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}