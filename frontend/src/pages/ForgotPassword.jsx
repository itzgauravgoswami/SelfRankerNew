import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Key, ShieldCheck, Sparkles, TrendingUp, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify & Reset
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(900); // 15 minutes = 900 seconds
  const [canResend, setCanResend] = useState(false);

  // Timer Countdown logic for Step 2
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Submit Email for Code Generation
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');

    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(data.message || 'Verification code sent successfully.');
      setStep(2);
      setTimer(900);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Code and New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) {
      return setError('All fields are required.');
    }
    if (code.trim().length !== 6) {
      return setError('Verification code must be exactly 6 digits.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/reset-password', { email, code, newPassword });
      setSuccessMsg('Your password has been successfully reset! Redirecting to Sign In page...');
      setError('');
      setTimeout(() => {
        navigate('/signin');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Code Resend
  const handleResendCode = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(data.message || 'A new verification code has been sent.');
      setTimer(900);
      setCanResend(false);
      setCode('');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
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
        <div className="w-full max-w-4xl bg-white/70 dark:bg-zinc-950/40 backdrop-blur-md border border-purple-100/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-12 h-auto max-h-fit animate-scale-up">
        
          {/* Left Side: Brand Showcase & Decorative Info */}
          <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-purple-900/10 via-purple-600/5 to-indigo-900/10 dark:from-zinc-900/50 dark:to-zinc-950/80 p-8 flex-col justify-between border-r border-purple-100/30 dark:border-zinc-800/40 relative">
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="h-8 w-auto object-contain brightness-110 contrast-105" />
                <span className="text-lg font-black font-display bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent animate-text-shine">
                  Self Ranker
                </span>
              </div>
              
              {/* Reset Password Security Info Widget */}
              <div className="bg-white/80 dark:bg-zinc-900/90 border border-purple-100/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm mt-8 font-sans">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="text-purple-600 dark:text-purple-400" size={18} />
                  <span className="text-xs font-bold text-slate-800 dark:text-white">Secure Password Reset</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  We use secure 6-digit numeric codes sent straight to your email. Active login sessions on other devices are automatically cleared upon reset for maximum security.
                </p>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100/50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white font-display text-xs">Forgot your credentials?</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Simply verify email access and set up a new password immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 dark:text-zinc-500">
              © 2026 Self Ranker.
            </div>
          </div>

          {/* Right Side: Reset Form */}
          <div className="col-span-12 md:col-span-7 p-6 md:p-8 flex flex-col justify-center">
            
            {/* Back to login */}
            <div className="mb-4">
              <Link to="/signin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>

            <div className="max-w-md w-full mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight mb-1">
                Reset Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 font-sans">
                {step === 1 ? "Enter your email to request a reset verification code." : "Enter the verification code and set your new password."}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && !error && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <CheckCircle size={14} className="flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {step === 1 ? (
                /* Step 1: Request Code Form */
                <form onSubmit={handleRequestCode} className="space-y-4 font-sans">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-zinc-350 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                        <Mail size={16} />
                      </span>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-purple-500/10 cursor-pointer flex items-center justify-center gap-2 h-[40px] hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Key size={14} /> Send Verification Code
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Verify OTP & Change Password Form */
                <form onSubmit={handleResetPassword} className="space-y-4 font-sans">
                  <div>
                    <label htmlFor="code" className="block text-xs font-bold text-slate-700 dark:text-zinc-350 mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                        <Key size={16} />
                      </span>
                      <input
                        id="code"
                        type="text"
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs font-medium tracking-widest text-center font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-bold text-slate-700 dark:text-zinc-350 mb-1.5">
                      New Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                        <Lock size={16} />
                      </span>
                      <input
                        id="newPassword"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 dark:text-zinc-350 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                        <Lock size={16} />
                      </span>
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1">
                    <span>Code expires in: <strong className="font-mono text-purple-600 dark:text-purple-400">{formatTime(timer)}</strong></span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={!canResend || loading}
                      className="text-purple-600 dark:text-purple-400 font-bold hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Resend Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-purple-500/10 cursor-pointer flex items-center justify-center gap-2 h-[40px] hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={14} /> Reset Password
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
