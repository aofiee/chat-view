export interface AuthUser {
  id: string;
  email: string;
  name?: string; // From JWT token
  displayName: string;
  picture?: string; // From JWT token  
  pictureUrl: string;
  accessToken: string;
  refreshToken: string;
  role: number;
  isEmployee: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface GoogleSigninRequest {
  r: string;
}

export interface GoogleSigninResponse {
  status: {
    code: number;
    message: string[];
  };
  data: string; // The OAuth URL returned by backend
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

export interface OAuthCallbackResponse {
  status: {
    code: number;
    message: string[];
  };
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  status: {
    code: number;
    message: string[];
  };
  data: {
    accessToken: string;
    refreshToken: string;
  };
}