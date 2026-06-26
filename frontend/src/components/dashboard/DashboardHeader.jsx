import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, Bell, Flame, Star, CheckCheck, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/ai-notes': 'AI Notes Generator',
  '/dashboard/ai-quiz': 'AI Quiz',
  '/dashboard/ai-qa': 'AI Question & Answer',
  '/dashboard/supreme-learning': 'Supreme Learning',
  '/dashboard/ai-tutor': 'AI Tutor',
  '/dashboard/gamification': 'Gamification',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/learning-path': 'Learning Path',
  '/dashboard/settings': 'Account Settings',
};

export default function DashboardHeader({ profile, theme, toggleTheme, onMenuToggle, onProfileUpdate }) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const data = await api.post('/auth/notifications/read');
      if (onProfileUpdate) {
        onProfileUpdate(prev => ({ ...prev, notifications: data.notifications }));
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleMarkOneRead = async (id, e) => {
    e.stopPropagation();
    try {
      const data = await api.post(`/auth/notifications/${id}/read`);
      if (onProfileUpdate) {
        onProfileUpdate(prev => ({ ...prev, notifications: data.notifications }));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const notifications = profile?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] || 'Dashboard';

  const LEVELS = [
    { level: 1, minXp: 0, maxXp: 500 },
    { level: 2, minXp: 500, maxXp: 1500 },
    { level: 3, minXp: 1500, maxXp: 3000 },
    { level: 4, minXp: 3000, maxXp: 5000 },
    { level: 5, minXp: 5000, maxXp: Infinity },
  ];

  const xp = profile?.xp || 0;
  const currentLevel = LEVELS.find(l => xp >= l.minXp && xp < l.maxXp) || LEVELS[LEVELS.length - 1];
  const nextLevel = LEVELS[currentLevel.level] || null;
  const xpInLevel = xp - currentLevel.minXp;
  const xpForNext = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1;
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpForNext) * 100));
  const streak = profile?.streak || 1;
  const levelNum = profile?.level || currentLevel.level;

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-purple-100/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-zinc-800/70 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-display font-bold text-base md:text-lg text-slate-800 dark:text-white leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Stats + Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Streak */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40">
          <Flame size={15} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streak} day streak</span>
        </div>

        {/* XP / Level */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40">
          <Star size={14} className="text-purple-600 dark:text-purple-400 fill-current" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Lvl {levelNum}</span>
              <span className="text-[10px] text-purple-500/70">{xp} XP</span>
            </div>
            <div className="w-20 h-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-full mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-zinc-800/70 transition-colors relative cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden font-sans animate-scale-up">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 font-display">
                  <Bell size={13} className="text-purple-600 dark:text-purple-400" /> Notifications
                  {unreadCount > 0 && (
                    <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-purple-100/65 dark:border-purple-900/50">
                      {unreadCount}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={11} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800/40 scrollbar-thin">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={(e) => !notif.read && handleMarkOneRead(notif._id, e)}
                      className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer ${notif.read ? 'hover:bg-slate-50/50 dark:hover:bg-zinc-800/10' : 'bg-purple-50/20 dark:bg-purple-950/10 hover:bg-purple-50/40 dark:hover:bg-purple-950/20'}`}
                    >
                      {/* Unread dot */}
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-slate-700 dark:text-zinc-200 leading-normal ${notif.read ? 'font-medium' : 'font-bold'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-zinc-800/70 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Avatar */}
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="User Avatar"
            className="w-8 h-8 rounded-xl object-cover shadow-md shadow-purple-500/10 cursor-pointer border border-purple-100 dark:border-zinc-800"
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/30 cursor-pointer">
            {(profile?.name || 'S').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
