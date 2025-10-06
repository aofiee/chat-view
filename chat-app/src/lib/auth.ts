import { OAuthCallbackResponse, GoogleSigninResponse, RefreshTokenResponse, AuthUser } from '@/types/auth';

// Google OAuth2 configuration
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
export const GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/callback';
// export const GOOGLE_SCOPE = 'openid profile email';
export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';


// Generate a random state string for security
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Generate a random string for r parameter
export function generateRandomString(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Store OAuth state with timestamp for validation
export function setOAuthState(state: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_state_timestamp', Date.now().toString());
  }
}

// Validate OAuth state
export function validateOAuthState(receivedState: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const storedState = localStorage.getItem('oauth_state');
  const timestamp = localStorage.getItem('oauth_state_timestamp');
  
  // Clear state after validation attempt
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_state_timestamp');
  
  if (!storedState || !timestamp) {
    console.warn('No stored OAuth state found');
    return false;
  }
  
  // Check if state matches
  if (storedState !== receivedState) {
    console.warn('OAuth state mismatch');
    return false;
  }
  
  // Check if state is not too old (15 minutes max)
  const stateAge = Date.now() - parseInt(timestamp);
  const maxAge = 15 * 60 * 1000; // 15 minutes
  
  if (stateAge > maxAge) {
    console.warn('OAuth state too old');
    return false;
  }
  
  return true;
}

// Step 1: Initial Google signin request
export async function initiateGoogleSignin(): Promise<GoogleSigninResponse> {
  try {
    const response = await fetch('http://localhost:8080/v1/api/auth/oauth2/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        r: generateRandomString()
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Google signin initiation error:', error);
    throw error;
  }
}

// Updated: Use backend-generated OAuth URL
export async function getGoogleAuthUrl(): Promise<string> {
  try {
    const response = await initiateGoogleSignin();
    if (response.status.code === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(response.status.message.join(", ") || "Failed to get OAuth URL");
    }
  } catch (error) {
    console.error("Failed to get Google auth URL:", error);
    throw error;
  }
}

// Step 2: Send OAuth callback to backend
export async function sendOAuthCallback(code: string, state: string): Promise<OAuthCallbackResponse> {
  try {
    console.log('Sending OAuth callback with:', { code: code.substring(0, 10) + '...', state });

    // Validate state parameter
    if (!validateOAuthState(state)) {
      throw new Error('Invalid or expired OAuth state. Please try signing in again.');
    }

    const response = await fetch('http://localhost:8080/v1/api/auth/oauth2/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    const result = await response.json();
    console.log('OAuth callback response:', { status: result.status, hasData: !!result.data });

    // Check if the response indicates success even if HTTP status is not 200
    if (result.status && result.status.code === 200) {
      return result;
    }

    // Handle specific OAuth errors
    if (result.status && result.status.message) {
      const errorMessages = Array.isArray(result.status.message)
        ? result.status.message
        : [result.status.message];

      const errorMessage = errorMessages.join(', ');

      // Add more context for common OAuth errors
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('expired') || errorMessage.includes('used')) {
        // Clear any existing auth data since the grant is invalid
        authStorage.clearAuth();
        throw new Error('Authorization code expired or already used. Please try signing in again.');
      } else if (errorMessage.includes('invalid_request')) {
        throw new Error('Invalid OAuth request parameters. Please try signing in again.');
      } else if (errorMessage.includes('invalid_client')) {
        throw new Error('OAuth client configuration error. Please contact support.');
      } else {
        throw new Error(`Authentication failed: ${errorMessage}`);
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('OAuth callback error:', error);
    // Clear auth data on any callback error
    authStorage.clearAuth();
    throw error;
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  try {
    const response = await fetch('http://localhost:8080/v1/api/auth/line/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

// Decode JWT token to get user info
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

// Create user object from JWT token
export function createUserFromToken(accessToken: string, refreshToken: string): AuthUser | null {
  const payload = decodeJWT(accessToken);
  if (!payload || !payload.payload) {
    return null;
  }

  const userPayload = payload.payload as Record<string, unknown>;
  return {
    id: userPayload.id?.toString() || '',
    email: (userPayload.email as string) || '',
    displayName: (userPayload.displayName as string) || '',
    pictureUrl: (userPayload.pictureUrl as string) || '',
    accessToken,
    refreshToken,
    role: (userPayload.role as number) || 0,
    isEmployee: (userPayload.isEmployee as boolean) || false,
  };
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return (payload.exp as number) < currentTime;
}

// Auth storage helpers
export const authStorage = {
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // Also store user data
      const user = createUserFromToken(accessToken, refreshToken);
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  },

  getUser: (): AuthUser | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_state_timestamp');
    }
  },

  getStoredState: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('oauth_state');
    }
    return null;
  },

  getStoredStateTimestamp: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('oauth_state_timestamp');
    }
    return null;
  },

  clearOAuthState: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_state_timestamp');
    }
  }
};
