'use client';

import { getGoogleAuthUrl } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Info, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function OAuthDebugPage() {
  const [authUrl, setAuthUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();

  const fetchAuthUrl = async () => {
    try {
      setLoading(true);
      setError('');
      const url = await getGoogleAuthUrl();
      setAuthUrl(url);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get OAuth URL');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthUrl();
  }, []);

  const getStoredOAuthData = () => {
    if (typeof window === 'undefined') return {};
    
    return {
      oauth_state: localStorage.getItem('oauth_state'),
      oauth_state_timestamp: localStorage.getItem('oauth_state_timestamp'),
      access_token: localStorage.getItem('access_token') ? '***exists***' : null,
      refresh_token: localStorage.getItem('refresh_token') ? '***exists***' : null,
      auth_user: localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') || '{}') : null,
    };
  };

  const getURLParams = () => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  const clearAuthData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_state_timestamp');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    }
    window.location.reload();
  };

  const storedData = getStoredOAuthData();
  const urlParams = getURLParams();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading OAuth configuration...</p>
        </div>
      </div>
    );
  }

  const authUrlParams = authUrl ? new URLSearchParams(authUrl.split('?')[1] || '') : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="text-blue-600" size={24} />
            <h1 className="text-3xl font-bold text-gray-900">OAuth Debug Information</h1>
            <button 
              onClick={fetchAuthUrl}
              className="ml-auto flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
          <p className="text-gray-600">
            Comprehensive OAuth debugging and testing interface. Use this to diagnose authentication issues.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading OAuth URL</h2>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchAuthUrl}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backend OAuth URL */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Backend-Generated OAuth URL</h2>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all mb-4">
              {authUrl || 'No URL available'}
            </div>
            {authUrlParams && (
              <div className="space-y-2 font-mono text-sm">
                <h3 className="font-semibold">OAuth Parameters:</h3>
                {Array.from(authUrlParams.entries()).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-bold bg-gray-100 px-2 py-1 rounded">{key}:</span> 
                    <span className="break-all">{decodeURIComponent(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current URL Parameters */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Page URL Parameters</h2>
            {Object.keys(urlParams).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(urlParams).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-medium">
                      {key}:
                    </span>
                    <span className="font-mono text-sm break-all">
                      {key === 'code' && value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No URL parameters found</p>
            )}
          </div>

          {/* Stored OAuth Data */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stored OAuth Data</h2>
            <div className="space-y-2">
              {Object.entries(storedData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-medium">
                    {key}:
                  </span>
                  <span className="font-mono text-sm break-all">
                    {value ? (typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()) : 'null'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* OAuth State Analysis */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">OAuth State Analysis</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${storedData.oauth_state ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">OAuth State: {storedData.oauth_state ? 'Present' : 'Missing'}</span>
              </div>
              
              {storedData.oauth_state_timestamp && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">
                    State Age: {Math.round((Date.now() - parseInt(storedData.oauth_state_timestamp)) / 1000 / 60)} minutes
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${urlParams.code ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">Authorization Code: {urlParams.code ? 'Present' : 'Missing'}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${urlParams.state ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">State Parameter: {urlParams.state ? 'Present' : 'Missing'}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${storedData.access_token ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">Access Token: {storedData.access_token ? 'Present' : 'Missing'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow border p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={clearAuthData}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear All Auth Data
            </button>
            
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
            >
              Start Fresh Login
            </Link>
            
            <Link
              href="/auth/callback"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
            >
              Test Callback Page
            </Link>

            <a 
              href={authUrl || '#'}
              className={`${authUrl ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded-lg transition-colors text-center`}
            >
              Test OAuth Flow
            </a>
          </div>
        </div>

        {/* Backend OAuth Flow Info */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Backend OAuth Flow</h2>
          <div className="text-blue-700 space-y-2 text-sm">
            <p>1. Frontend calls: <code className="bg-blue-100 px-2 py-1 rounded">POST http://localhost:8080/v1/api/auth/oauth2/signin</code></p>
            <p>2. Backend returns OAuth URL with state and redirect_uri</p>
            <p>3. User redirected to Google OAuth consent</p>
            <p>4. Google redirects to: <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:3000/auth/callback</code></p>
            <p>5. Frontend sends code/state to: <code className="bg-blue-100 px-2 py-1 rounded">POST http://localhost:8080/v1/api/auth/oauth2/callback</code></p>
            <p>6. Backend exchanges code for tokens with Google and returns JWT tokens</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-yellow-900 mb-2">Common Issues & Solutions</h3>
          <ul className="text-yellow-800 text-sm space-y-1">
            <li>• <strong>Missing code/state:</strong> You may have navigated directly to the callback page</li>
            <li>• <strong>State mismatch:</strong> Clear auth data and try logging in again</li>
            <li>• <strong>Expired state:</strong> State older than 15 minutes is automatically cleared</li>
            <li>• <strong>Authorization code expired:</strong> Code expires in ~10 minutes, start fresh login</li>
            <li>• <strong>Backend not running:</strong> Make sure the backend server is running on port 8080</li>
          </ul>
        </div>
      </div>
    </div>
  );
}