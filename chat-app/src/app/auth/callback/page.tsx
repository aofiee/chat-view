'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sendOAuthCallback } from '@/lib/auth';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthCallbackPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto text-blue-600 animate-spin mb-4" size={32} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto text-blue-600 animate-spin mb-4" size={32} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();

  // Check if this is a legitimate OAuth callback
  useEffect(() => {
    const hasOAuthParams = searchParams.has('code') || searchParams.has('error') || searchParams.has('state');
    const hasOAuthState = typeof window !== 'undefined' && localStorage.getItem('oauth_state');
    
    if (!hasOAuthParams && !hasOAuthState) {
      console.log('No OAuth parameters or state found, redirecting to login');
      router.replace('/login');
      return;
    }
  }, [searchParams, router]);

  useEffect(() => {
    let isCallbackProcessed = false;
    
    const handleCallback = async () => {
      // Prevent duplicate calls
      if (isCallbackProcessed) {
        return;
      }
      isCallbackProcessed = true;

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('OAuth callback parameters:', { 
          hasCode: !!code, 
          hasState: !!state, 
          hasError: !!error,
          error,
          errorDescription 
        });

        // Check if this is a direct navigation to callback page without OAuth parameters
        if (!code && !state && !error) {
          console.log('Direct navigation to callback page detected, redirecting to login');
          setStatus('error');
          setMessage('Direct access to this page is not allowed. Please use the login page.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }

        if (error) {
          let errorMessage = `OAuth error: ${error}`;
          if (errorDescription) {
            errorMessage += ` - ${errorDescription}`;
          }
          throw new Error(errorMessage);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter. This may happen if the OAuth flow was interrupted.');
        }

        setMessage('Verifying with Google...');

        const response = await sendOAuthCallback(code, state);
        
        if (response.status.code !== 200) {
          throw new Error(response.status.message.join(', ') || 'Authentication failed');
        }

        if (!response.data.accessToken || !response.data.refreshToken) {
          throw new Error('No tokens received from server');
        }

        setMessage('Setting up your session...');

        // Set tokens first
        setTokens(response.data.accessToken, response.data.refreshToken);
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Clear the URL to prevent refresh issues and remove sensitive data
        window.history.replaceState({}, document.title, '/auth/callback');

        // Short delay before redirect to show success message
        setTimeout(() => {
          router.push('/');
        }, 1500);

      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        
        // Handle specific OAuth errors
        if (err instanceof Error) {
          if (err.message.includes('invalid_grant') || err.message.includes('expired') || err.message.includes('used')) {
            setMessage('The authorization code has expired or been used. This can happen if you refresh the page or take too long to complete the sign-in process. Please try signing in again.');
          } else if (err.message.includes('invalid_request')) {
            setMessage('Invalid OAuth request. Please try signing in again.');
          } else if (err.message.includes('access_denied')) {
            setMessage('You denied access to the application. Please try signing in again and grant the necessary permissions.');
          } else if (err.message.includes('invalid_client')) {
            setMessage('OAuth client configuration error. Please contact support if this problem persists.');
          } else if (err.message.includes('Direct access')) {
            setMessage(err.message);
          } else {
            setMessage(err.message);
          }
        } else {
          setMessage('Authentication failed for an unknown reason');
        }
      }
    };

    // Add a small delay to prevent React strict mode double execution
    const timeoutId = setTimeout(handleCallback, 100);
    
    return () => {
      clearTimeout(timeoutId);
      isCallbackProcessed = true;
    };
  }, [searchParams, setTokens, router]);

  const handleRetry = () => {
    router.push('/login');
  };

  const handleGoBack = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="text-blue-600 animate-spin" size={32} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Authenticating</h2>
              <p className="text-gray-600 mb-6">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  🎉 You&apos;re now signed in and will be redirected to your dashboard shortly.
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Authentication Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Don&apos;t worry! This can happen for various reasons. You can try signing in again.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGoBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </>
          )}

          {status !== 'loading' && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Your authentication is secured by Google OAuth2
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}