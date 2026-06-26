import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setToken, setLoggedIn } from '../utils/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function GitHubCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (!code) {
        setError('No authorization code received from GitHub.');
        return;
      }

      try {
        const data = await api.post('/auth/github', { code });
        setToken(data.token);
        setLoggedIn(true);
        navigate('/dashboard');
      } catch (err) {
        console.error('GitHub authentication failed:', err);
        setError(err.message || 'GitHub authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-zinc-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-3xl p-8 shadow-xl text-center animate-scale-up">
        {error ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">Authentication Failed</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">{error}</p>
            <button
              onClick={() => navigate('/signin')}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 size={36} className="animate-spin text-purple-600 mx-auto" />
            <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">Connecting to GitHub</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Verifying credentials and setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}
