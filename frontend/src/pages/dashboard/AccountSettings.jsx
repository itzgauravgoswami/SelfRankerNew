import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Trash2, Bell, Shield, Camera, Save,
  Eye, EyeOff, AlertTriangle, CheckCircle, ChevronRight, LogOut, Palette,
  Smartphone, Monitor
} from 'lucide-react';
import { api, setToken } from '../../utils/api';

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100/80 dark:border-zinc-800/50">
        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
          <Icon size={17} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-slate-800 dark:text-white">{title}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, hint, rightEl }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition pr-10"
        />
        {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
      {hint && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-fade-in-up
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

export default function AccountSettings({ onProfileUpdate }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile state
  const [name, setName] = useState('Student');
  const [email, setEmail] = useState('student@example.com');
  const [bio, setBio] = useState('');
  const [examGoal, setExamGoal] = useState('JEE Advanced');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [maxDevices, setMaxDevices] = useState(1);

  // Connection states
  const [googleId, setGoogleId] = useState(null);
  const [githubId, setGithubId] = useState(null);
  const [microsoftId, setMicrosoftId] = useState(null);

  const fetchSessions = async () => {
    try {
      const data = await api.get('/auth/sessions');
      setSessions(data.sessions || []);
      setMaxDevices(data.maxDevices || 1);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
    const successMsgParam = urlParams.get('success');
    const errorMsgParam = urlParams.get('error');
    if (successMsgParam) {
      showToast(successMsgParam, 'success');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
    } else if (errorMsgParam) {
      showToast(errorMsgParam, 'error');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/auth/profile');
        const user = data.user;
        setName(user.name || '');
        setEmail(user.email || '');
        setBio(user.bio || '');
        setExamGoal(user.examGoal || 'JEE Advanced');
        setAvatarUrl(user.avatarUrl || null);
        setLevel(user.level || 1);
        setXp(user.xp || 0);
        setGoogleId(user.googleId || null);
        setGithubId(user.githubId || null);
        setMicrosoftId(user.microsoftId || null);
        if (user.notificationPreferences) {
          setNotifs(user.notificationPreferences);
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      }
    };
    fetchProfile();
    fetchSessions();
  }, []);

  const handleSignOutDevice = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      showToast('Device signed out successfully!');
      fetchSessions();
    } catch (err) {
      showToast(err.message || 'Failed to sign out device.', 'error');
    }
  };

  const handleSignOutAllOtherDevices = async () => {
    try {
      const otherSessions = sessions.filter(s => !s.isCurrent);
      if (otherSessions.length === 0) {
        showToast('No other active devices found.');
        return;
      }
      for (const s of otherSessions) {
        await api.delete(`/auth/sessions/${s.sessionId}`);
      }
      showToast('Signed out of all other devices.');
      fetchSessions();
    } catch (err) {
      showToast(err.message || 'Failed to sign out other devices.', 'error');
    }
  };

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notification prefs
  const [notifs, setNotifs] = useState({
    streakReminders: true,
    quizResults: true,
    weeklyDigest: false,
    rankUpdates: true,
  });

  const handleSaveNotifs = async () => {
    try {
      const data = await api.put('/auth/notification-preferences', notifs);
      showToast('Notification preferences saved successfully!');
      if (onProfileUpdate) {
        onProfileUpdate(prev => ({ ...prev, notificationPreferences: data.notificationPreferences || notifs }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to save notification preferences.', 'error');
    }
  };

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Feedback toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    try {
      const data = await api.post('/auth/profile-update', { name, email, bio, examGoal });
      if (data.token) {
        setToken(data.token);
      }
      showToast('Profile updated successfully!');
      if (onProfileUpdate) {
        onProfileUpdate(prev => ({ ...prev, name, email, bio, examGoal }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      showToast('Uploading photo...');
      const data = await api.post('/data/avatar', formData);
      setAvatarUrl(data.avatarUrl);
      showToast('Profile photo updated successfully!');
      if (onProfileUpdate) {
        onProfileUpdate(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload profile photo.', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) { showToast('Please fill all password fields.', 'error'); return; }
    if (newPass.length < 8) { showToast('New password must be at least 8 characters.', 'error'); return; }
    if (newPass !== confirmPass) { showToast('New passwords do not match.', 'error'); return; }
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPass,
        newPassword: newPass
      });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    }
  };

  const handleConnectGoogle = () => {
    if (!window.google) {
      showToast('Google SDK not loaded yet. Please refresh the page and try again.', 'error');
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.access_token) {
          try {
            showToast('Connecting Google account...');
            const data = await api.post('/auth/connect-google', { accessToken: tokenResponse.access_token });
            setGoogleId(data.user.googleId);
            showToast('Google account connected successfully!');
            if (onProfileUpdate) onProfileUpdate(data.user);
          } catch (err) {
            showToast(err.message || 'Failed to connect Google account.', 'error');
          }
        }
      }
    });
    client.requestAccessToken();
  };

  const handleConnectGitHub = () => {
    const token = localStorage.getItem('sr_token');
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/github/callback`);
    const state = `connect_${token}`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleConnectMicrosoft = () => {
    const token = localStorage.getItem('sr_token');
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/microsoft/callback`);
    const state = `connect_${token}`;
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=openid%20profile%20email%20User.Read&state=${state}`;
  };

  const handleDisconnectOauth = async (provider) => {
    try {
      showToast(`Disconnecting ${provider}...`);
      const data = await api.post('/auth/disconnect-oauth', { provider });
      if (provider === 'google') setGoogleId(null);
      else if (provider === 'github') setGithubId(null);
      else if (provider === 'microsoft') setMicrosoftId(null);
      showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected successfully.`);
      if (onProfileUpdate) onProfileUpdate(data.user);
    } catch (err) {
      showToast(err.message || `Failed to disconnect ${provider}.`, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { showToast('Type DELETE to confirm.', 'error'); return; }
    try {
      await api.delete('/auth/delete-account');
      showToast('Your account and all associated data have been permanently deleted.');
      localStorage.removeItem('sr_logged_in');
      localStorage.removeItem('sr_token');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Failed to delete account. Please try again.', 'error');
    }
  };

  const passwordStrength = () => {
    if (!newPass) return null;
    if (newPass.length < 6) return { label: 'Weak', color: 'bg-red-500', w: '33%' };
    if (newPass.length < 10 || !/[^a-zA-Z0-9]/.test(newPass)) return { label: 'Moderate', color: 'bg-amber-500', w: '66%' };
    return { label: 'Strong', color: 'bg-green-500', w: '100%' };
  };
  const strength = passwordStrength();

  const EyeToggle = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle} className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <>
      <Toast message={toast.message} type={toast.type} />

      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Profile Section ───────────────────────────────────────── */}
        <Section title="Profile Information" subtitle="Update your public profile details" icon={User}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-purple-100 dark:border-zinc-800" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-display font-extrabold text-2xl shadow-lg shadow-purple-500/30">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/70 flex items-center justify-center shadow-sm hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
              >
                <Camera size={11} className="text-purple-600 dark:text-purple-400" />
              </button>
            </div>
            <div>
              <p className="font-display font-bold text-slate-800 dark:text-white">{name}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{email}</p>
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg mt-1 inline-block">
                Level {level} · {xp} XP
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" hint="Used for notifications & login" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Exam Goal</label>
                <select value={examGoal} onChange={e => setExamGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition appearance-none">
                  {['JEE Main', 'JEE Advanced', 'NEET', 'UPSC', 'CAT', 'GATE', 'IBPS', 'SSC CGL', 'General'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <InputField label="Short Bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. JEE Aspirant 2025" />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-sm font-semibold shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <Save size={15} />Save Profile
              </button>
            </div>
          </form>
        </Section>

        {/* ── Security Section ──────────────────────────────────────── */}
        <Section title="Security & Password" subtitle="Keep your account secure with a strong password" icon={Lock}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <InputField
              label="Current Password" type={showCurrent ? 'text' : 'password'}
              value={currentPass} onChange={e => setCurrentPass(e.target.value)}
              placeholder="Enter current password"
              rightEl={<EyeToggle show={showCurrent} onToggle={() => setShowCurrent(s => !s)} />}
            />
            <InputField
              label="New Password" type={showNew ? 'text' : 'password'}
              value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="Min. 8 characters"
              rightEl={<EyeToggle show={showNew} onToggle={() => setShowNew(s => !s)} />}
            />
            {/* Strength bar */}
            {strength && (
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 mb-1">
                  <span>Password strength</span><span className="font-semibold">{strength.label}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-zinc-800/60 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} rounded-full transition-all duration-500`} style={{ width: strength.w }} />
                </div>
              </div>
            )}
            <InputField
              label="Confirm New Password" type={showConfirm ? 'text' : 'password'}
              value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              placeholder="Repeat new password"
              rightEl={<EyeToggle show={showConfirm} onToggle={() => setShowConfirm(s => !s)} />}
            />
            {confirmPass && newPass !== confirmPass && (
              <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertTriangle size={12} />Passwords do not match</p>
            )}
            <div className="flex justify-end pt-2">
              <button type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-sm font-semibold shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <Shield size={15} />Update Password
              </button>
            </div>
          </form>
        </Section>

        {/* ── Notification Preferences ──────────────────────────────── */}
        <Section title="Notification Preferences" subtitle="Choose what you want to be notified about" icon={Bell}>
          <div className="space-y-3">
            {[
              { key: 'streakReminders', label: 'Streak Reminders', desc: 'Daily nudge to keep your streak alive' },
              { key: 'quizResults', label: 'Quiz Result Alerts', desc: 'Get notified when AI quiz results are ready' },
              { key: 'weeklyDigest', label: 'Weekly Progress Digest', desc: 'A summary of your weekly learning activity' },
              { key: 'rankUpdates', label: 'Rank Change Alerts', desc: 'Know when your global rank changes' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100/70 dark:border-zinc-800/40 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{label}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${notifs[key] ? 'bg-purple-600' : 'bg-slate-200 dark:bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${notifs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSaveNotifs}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-sm font-semibold shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Save size={15} />Save Preferences
            </button>
          </div>
        </Section>

        {/* ── Connected Accounts ─────────────────────────────────────── */}
        <Section title="Connected Accounts" subtitle="Link social profiles to sign in with them" icon={Shield}>
          <div className="space-y-4">
            {/* Google */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-zinc-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center border border-slate-200/50 dark:border-zinc-800/50">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Google</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Sign in using your Google account</p>
                </div>
              </div>
              <div>
                {googleId ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnectOauth('google')}
                      className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* GitHub */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-zinc-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center border border-slate-200/50 dark:border-zinc-800/50">
                  <svg className="w-4 h-4 fill-current text-slate-800 dark:text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">GitHub</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Sign in using your GitHub account</p>
                </div>
              </div>
              <div>
                {githubId ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnectOauth('github')}
                      className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGitHub}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Microsoft */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center border border-slate-200/50 dark:border-zinc-800/50">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#f35325" d="M0 0h11v11H0z"/>
                    <path fill="#81bc06" d="M12 0h11v11H12z"/>
                    <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                    <path fill="#ffba08" d="M12 12h11v11H12z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Microsoft</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Sign in using your Microsoft account</p>
                </div>
              </div>
              <div>
                {microsoftId ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnectOauth('microsoft')}
                      className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectMicrosoft}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

          </div>
        </Section>

        {/* ── Active Devices ─────────────────────────────────────────── */}
        <Section title="Active Devices" subtitle={`Manage your active sessions (${sessions.length} of ${maxDevices} active)`} icon={Shield}>
          <div className="space-y-4">
            {sessions.map((session, i) => (
              <div key={session.sessionId || i} className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-zinc-800/40 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400">
                    {/mobile|android|iphone|ipad/i.test(session.os || '') ? (
                      <Smartphone size={18} />
                    ) : (
                      <Monitor size={18} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                        {session.deviceName || 'Unknown Device'}
                      </p>
                      {session.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                      IP: {session.ip || 'Unknown'} • Logged in: {new Date(session.loginTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleSignOutDevice(session.sessionId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200/60 dark:border-red-900/40 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Danger Zone ───────────────────────────────────────────── */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-red-200/60 dark:border-red-900/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-red-100/60 dark:border-red-900/20">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={17} className="text-red-500" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-red-600 dark:text-red-400">Danger Zone</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">These actions are irreversible — proceed with caution</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Sign out all devices */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100/70 dark:border-zinc-800/40">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Sign out of all other devices</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Revokes all active sessions except this one</p>
              </div>
              <button onClick={handleSignOutAllOtherDevices}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-700/70 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/70 transition-all">
                <LogOut size={14} />Sign Out All
              </button>
            </div>

            {/* Delete account */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Permanently deletes your account and all data. This cannot be undone.</p>
              </div>
              <button onClick={() => setShowDeleteModal(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all">
                <Trash2 size={14} />Delete
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-red-200/60 dark:border-red-900/40 shadow-2xl p-6 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white text-center mb-1">Delete Your Account?</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 text-center mb-6 leading-relaxed">
              All your data — notes, quizzes, learning paths, XP — will be <span className="text-red-500 font-semibold">permanently deleted</span>. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                Type <span className="text-red-500 font-bold">DELETE</span> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl border border-red-200/60 dark:border-red-800/40 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 transition text-center font-mono tracking-widest"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/70 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/70 transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-500/25 flex items-center justify-center gap-2">
                <Trash2 size={15} />Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
