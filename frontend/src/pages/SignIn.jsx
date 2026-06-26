import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Sparkles, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { api, setToken, setLoggedIn } from '../utils/api';
import DeviceLimitDialog from '../components/DeviceLimitDialog';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceLimitInfo, setDeviceLimitInfo] = useState(null); // { plan, maxDevices, activeSessions, loginType, payload }

  useEffect(() => {
    // Check if token was passed in query parameter (backend-driven OAuth success redirect)
    const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setLoggedIn(true);
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    if (!window.google) {
      setError('Google SDK not loaded yet. Please refresh the page and try again.');
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.access_token) {
          try {
            setError('');
            setLoading(true);
            const data = await api.post('/auth/google-token', { accessToken: tokenResponse.access_token });
            if (data.requiresPassword) {
              navigate(`/signup?oauth_setup=true&email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}&avatarUrl=${encodeURIComponent(data.avatarUrl || '')}&provider=google&providerId=${encodeURIComponent(data.googleId)}`);
              setLoading(false);
              return;
            }
            if (data.deviceLimitReached) {
              setDeviceLimitInfo({
                plan: data.plan,
                maxDevices: data.maxDevices,
                activeSessions: data.activeSessions,
                loginType: 'google',
                payload: { accessToken: tokenResponse.access_token }
              });
              setLoading(false);
              return;
            }
            setToken(data.token);
            setLoggedIn(true);
            navigate('/dashboard');
          } catch (err) {
            setError(err.message || 'Google sign-in failed.');
          } finally {
            setLoading(false);
          }
        }
      }
    });
    client.requestAccessToken();
  };

  const handleGitHubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/github/callback`);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&redirect_uri=${redirectUri}`;
  };

  const handleMicrosoftLogin = () => {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/microsoft/callback`);
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=openid%20profile%20email%20User.Read`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.deviceLimitReached) {
        setDeviceLimitInfo({
          plan: data.plan,
          maxDevices: data.maxDevices,
          activeSessions: data.activeSessions,
          loginType: 'local',
          payload: { email, password }
        });
        setLoading(false);
        return;
      }
      setToken(data.token);
      setLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLimit = async (selectedSessionId) => {
    if (!deviceLimitInfo) return;
    setError('');
    setLoading(true);
    const { loginType, payload } = deviceLimitInfo;
    setDeviceLimitInfo(null);
    try {
      let data;
      if (loginType === 'local') {
        data = await api.post('/auth/login', { ...payload, force: true, evictSessionId: selectedSessionId });
      } else if (loginType === 'google') {
        data = await api.post('/auth/google-token', { ...payload, force: true, evictSessionId: selectedSessionId });
      }
      if (data && data.token) {
        setToken(data.token);
        setLoggedIn(true);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Verification of session force-override failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-zinc-350 antialiased selection:bg-purple-200 dark:selection:bg-purple-900/60 selection:text-purple-900 dark:selection:text-purple-100 transition-colors duration-300">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(243,239,252,0.4),rgba(250,249,254,0.95))] dark:bg-[linear-gradient(to_bottom,rgba(8,10,16,0.4),rgba(9,9,11,0.95))] pointer-events-none -z-10" />
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-10 left-10 w-[250px] h-[250px] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[80px] -z-10 pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-indigo-200/20 dark:bg-indigo-950/10 rounded-full blur-[80px] -z-10 pointer-events-none animate-float" />

      {/* Main Content Layout Wrapper */}
      <div className="py-8 px-4 sm:px-6 flex items-center justify-center min-h-screen">
        {/* Main Container: Compact Height */}
        <div className="w-full max-w-4xl bg-white/70 dark:bg-zinc-950/40 backdrop-blur-md border border-purple-100/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-12 h-auto max-h-fit animate-scale-up">
        
        {/* Left Side: Brand Showcase & Widget (Fills space, premium layout) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-purple-900/10 via-purple-600/5 to-indigo-900/10 dark:from-zinc-900/50 dark:to-zinc-950/80 p-8 flex-col justify-between border-r border-purple-100/30 dark:border-zinc-800/40 relative">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="h-8 w-auto object-contain brightness-110 contrast-105" />
              <span className="text-lg font-black font-display bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent animate-text-shine">
                Self Ranker
              </span>
            </div>
            
            {/* Visual Rank Comparison Widget */}
            <div className="bg-white/80 dark:bg-zinc-900/90 border border-purple-100/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm mt-4 font-sans scale-95 origin-top-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1"><TrendingUp size={12} className="text-purple-600" /> Cohort Ranks</span>
                <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/40">Active</span>
              </div>
              
              <div className="space-y-2 text-xs mb-3">
                <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950/30">
                  <span className="text-slate-700 dark:text-zinc-300 font-medium">1. Amit Sharma</span>
                  <span className="font-bold text-slate-500">99.2%</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/50 border border-purple-100/40 dark:border-purple-900/30">
                  <span className="text-purple-700 dark:text-purple-400 font-extrabold flex items-center gap-1"><CheckCircle size={10} /> You (Aptitude)</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">97.5%</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950/30">
                  <span className="text-slate-700 dark:text-zinc-300 font-medium">3. Preeti Patel</span>
                  <span className="font-bold text-slate-500">96.8%</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-[10px]">
                <span className="text-slate-400 dark:text-zinc-500">Placement index:</span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400">Top 3%</span>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100/50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white font-display text-xs">Live Percentile Ranks</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Compare scores in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-zinc-500">
            © 2026 Self Ranker.
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="col-span-12 md:col-span-7 p-6 md:p-8 flex flex-col justify-center">
          
          {/* Back button */}
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors">
              <ArrowLeft size={14} /> Back to home
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight mb-1">
              Welcome back
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 font-sans">
              Enter your credentials to access your dashboard.
            </p>
            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-3 mb-5 items-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all text-xs font-semibold cursor-pointer card-hover h-[40px]"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={handleGitHubLogin}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all text-xs font-semibold cursor-pointer card-hover h-[40px]"
              >
                <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                GitHub
              </button>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all text-xs font-semibold cursor-pointer card-hover h-[40px]"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f35325" d="M0 0h11v11H0z"/>
                  <path fill="#81bc06" d="M12 0h11v11H12z"/>
                  <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                  <path fill="#ffba08" d="M12 12h11v11H12z"/>
                </svg>
                Microsoft
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4 text-center font-sans">
              <span className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-100 dark:bg-zinc-800/80 -z-10" />
              <span className="px-2.5 bg-[#f6f3fc] dark:bg-[#0c0e15] text-[10px] text-slate-400 dark:text-zinc-500 rounded-md">Or sign in with email</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 font-sans">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 dark:text-zinc-300 mb-1 font-display uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-zinc-500">
                    <Mail size={14} />
                  </span>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-semibold text-slate-700 dark:text-zinc-300 font-display uppercase tracking-wide">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-zinc-500">
                    <Lock size={14} />
                  </span>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all hover:scale-101 cursor-pointer font-display text-sm tracking-wide mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-400 font-sans">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                Get Started free
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {deviceLimitInfo && (
        <DeviceLimitDialog
          isOpen={!!deviceLimitInfo}
          plan={deviceLimitInfo.plan}
          maxDevices={deviceLimitInfo.maxDevices}
          activeSessions={deviceLimitInfo.activeSessions}
          onContinue={handleContinueLimit}
          onCancel={() => setDeviceLimitInfo(null)}
        />
      )}
    </div>
  </div>
);
}
