import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import AINotes from './dashboard/AINotes';
import AIQuiz from './dashboard/AIQuiz';
import AIQA from './dashboard/AIQA';
import SupremeLearning from './dashboard/SupremeLearning';
import AITutor from './dashboard/AITutor';
import Gamification from './dashboard/Gamification';
import Analytics from './dashboard/Analytics';
import LearningPath from './dashboard/LearningPath';
import AccountSettings from './dashboard/AccountSettings';
import { UsageProvider } from '../context/UsageContext';
import { api } from '../utils/api';
import { LOGO_BASE64 } from '../utils/logoBase64';
import {
  FileText, HelpCircle, MessageSquare, Tv, Bot, Trophy, BarChart2, Map,
  Flame, Star, Zap, TrendingUp, ArrowRight, BookOpen, Users, ChevronRight,
  Activity, Target, Clock, Award, Shield, Smartphone, Monitor
} from 'lucide-react';

const MODULES = [
  {
    path: '/dashboard/ai-notes', label: 'AI Notes', icon: FileText,
    desc: 'Generate exam-ready notes with math support',
    gradient: 'from-violet-600 to-purple-700',
    lightBg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-100 dark:border-violet-900/30',
    tag: 'Study'
  },
  {
    path: '/dashboard/ai-quiz', label: 'AI Quiz', icon: HelpCircle,
    desc: 'MCQs with instant explanations & scoring',
    gradient: 'from-indigo-600 to-blue-700',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-100 dark:border-indigo-900/30',
    tag: 'Practice'
  },
  {
    path: '/dashboard/ai-qa', label: 'AI Q&A', icon: MessageSquare,
    desc: 'Descriptive questions with model answers',
    gradient: 'from-purple-600 to-fuchsia-700',
    lightBg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-100 dark:border-purple-900/30',
    tag: 'Practice'
  },
  {
    path: '/dashboard/supreme-learning', label: 'Supreme Learning', icon: Tv,
    desc: 'Video + AI notes side by side, any language',
    gradient: 'from-sky-600 to-indigo-700',
    lightBg: 'bg-sky-50 dark:bg-sky-950/20',
    border: 'border-sky-100 dark:border-sky-900/30',
    tag: 'Video'
  },
  {
    path: '/dashboard/ai-tutor', label: 'AI Tutor', icon: Bot,
    desc: 'Personal AI mentor for any topic or doubt',
    gradient: 'from-violet-700 to-indigo-800',
    lightBg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-100 dark:border-violet-900/30',
    tag: 'Chat'
  },
  {
    path: '/dashboard/gamification', label: 'Gamification', icon: Trophy,
    desc: 'XP, badges, levels and global leaderboard',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    tag: 'Rewards'
  },
  {
    path: '/dashboard/analytics', label: 'Analytics', icon: BarChart2,
    desc: 'Score trends, strengths & focus areas',
    gradient: 'from-emerald-600 to-teal-700',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    tag: 'Insights'
  },
  {
    path: '/dashboard/learning-path', label: 'Learning Path', icon: Map,
    desc: 'AI-curated day-by-day study roadmaps',
    gradient: 'from-blue-600 to-cyan-700',
    lightBg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    tag: 'Planning'
  },
];

const RECENT_ACTIVITY = [
  { type: 'Quiz', subject: 'Physics — Thermodynamics', score: '88%', time: '2h ago', icon: HelpCircle, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { type: 'Notes', subject: 'Maths — Integration', score: 'Generated', time: '5h ago', icon: FileText, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  { type: 'Q&A', subject: 'History — Mughal Era', score: '4/5 done', time: '1d ago', icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { type: 'Tutor', subject: 'Chemistry — Organic Rxn', score: '12 msgs', time: '2d ago', icon: Bot, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30' },
];

function StatRing({ percent, color, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-zinc-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - percent / 100)}
        className="transition-all duration-1000" />
    </svg>
  );
}

const LEVELS = [
  { level: 1, title: 'Novice', minXp: 0, maxXp: 500, color: 'from-gray-400 to-gray-500' },
  { level: 2, title: 'Scholar', minXp: 500, maxXp: 1500, color: 'from-blue-400 to-blue-600' },
  { level: 3, title: 'Expert', minXp: 1500, maxXp: 3000, color: 'from-purple-500 to-violet-600' },
  { level: 4, title: 'Master', minXp: 3000, maxXp: 5000, color: 'from-amber-400 to-orange-500' },
  { level: 5, title: 'Legend', minXp: 5000, maxXp: Infinity, color: 'from-yellow-400 to-amber-500' },
];

function getLevelDetails(xp) {
  const current = LEVELS.find(l => xp >= l.minXp && xp < l.maxXp) || LEVELS[LEVELS.length - 1];
  const next = LEVELS[current.level] || null;
  const xpInLevel = xp - current.minXp;
  const xpForNext = next ? next.minXp - current.minXp : 1;
  const percent = Math.min(100, Math.round((xpInLevel / xpForNext) * 100));
  return { current, next, percent };
}

function DashboardOverview({ profile, onUpgrade }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  
  const xp = profile?.xp || 0;
  const levelDetails = getLevelDetails(xp);

  const [stats, setStats] = useState({
    sessions: 0,
    questions: 0,
    avgScore: 0,
    globalRank: '-'
  });

  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [analytics, leaderboard] = await Promise.all([
          api.get('/data/analytics'),
          api.get('/data/leaderboard')
        ]);

        setAnalyticsData(analytics);

        const totalSessions = analytics.weeklyActivity.reduce((sum, item) => sum + item.sessions, 0);
        const totalQuestions = analytics.weeklyActivity.reduce((sum, item) => sum + item.questions, 0);
        const avgScore = analytics.quizScores.length ? Math.round(analytics.quizScores.reduce((sum, item) => sum + item.score, 0) / analytics.quizScores.length) : 0;
        const userRank = leaderboard.find(item => item.isUser)?.rank || '-';

        setStats({
          sessions: totalSessions,
          questions: totalQuestions,
          avgScore: avgScore,
          globalRank: userRank
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    };
    fetchStats();
  }, []);

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (profile?.isPremium) {
      const fetchSessions = async () => {
        try {
          const data = await api.get('/auth/sessions');
          setSessions(data.sessions || []);
        } catch (err) {
          console.error('Failed to fetch dashboard sessions:', err);
        }
      };
      fetchSessions();
    }
  }, [profile?.isPremium]);

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-200/40 dark:border-purple-900/30 shadow-lg shadow-purple-500/10">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a3c] via-[#2d1270] to-[#1e0f5a]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-purple-600/20 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/15 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: text */}
          <div>
            <p className="text-purple-300/80 text-xs font-semibold uppercase tracking-widest mb-2">{greeting} 👋</p>
            <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight mt-3">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-violet-200">{profile?.name || 'Student'}!</span>
            </h1>
            {profile && !profile.isPremium && (
              <button
                type="button"
                onClick={onUpgrade}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-0"
              >
                ⭐ Upgrade to Premium (INR 21)
              </button>
            )}
            {profile && profile.isPremium && (
              <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/60 border border-purple-500/50 text-purple-200 font-extrabold text-[10px] rounded-xl tracking-wider uppercase">
                🏆 Premium Member
              </span>
            )}
            <p className="text-purple-200/60 text-sm max-w-md leading-relaxed mt-2">
              You're on a <span className="text-orange-300 font-semibold">{profile?.streak || 1}-day streak</span> and ranked <span className="text-purple-300 font-semibold">#{stats.globalRank} globally</span>. Keep going — you're doing great this week.
            </p>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-2.5 mt-5">
              {[
                { icon: Flame, label: `${profile?.streak || 1}-Day Streak`, iconClass: 'text-orange-400' },
                { icon: Star, label: `Level ${levelDetails.current.level} · ${levelDetails.current.title}`, iconClass: 'text-yellow-300' },
                { icon: Zap, label: `${xp.toLocaleString()} XP`, iconClass: 'text-purple-300' },
              ].map(({ icon: Icon, label, iconClass }) => (
                <div key={label} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm">
                  <Icon size={13} className={iconClass} />
                  <span className="text-white/90 text-xs font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: XP progress ring + mini stats */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-4 sm:gap-5 flex-shrink-0">
            {/* XP ring */}
            <div className="relative flex-shrink-0">
              <StatRing percent={levelDetails.percent} color="#a78bfa" size={80} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-display font-bold text-base leading-none">{levelDetails.percent}%</span>
                <span className="text-purple-300 text-[9px] font-medium mt-0.5">{levelDetails.next ? `to Lv ${levelDetails.next.level}` : 'Max'}</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Sessions', value: stats.sessions, color: 'text-purple-300' },
                { label: 'Questions done', value: stats.questions, color: 'text-violet-300' },
                { label: 'Avg score', value: `${stats.avgScore}%`, color: 'text-indigo-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`font-display font-bold text-base ${color} w-8 text-right`}>{value}</div>
                  <span className="text-white/50 text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Study Sessions', value: stats.sessions, trend: 'Updated live', icon: BookOpen, trendColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-violet-100 dark:bg-violet-950/40', iconColor: 'text-violet-600 dark:text-violet-400' },
          { label: 'Questions Solved', value: stats.questions, trend: 'Updated live', icon: Activity, trendColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-indigo-100 dark:bg-indigo-950/40', iconColor: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Avg Quiz Score', value: `${stats.avgScore}%`, trend: 'Based on quizzes', icon: Target, trendColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-purple-100 dark:bg-purple-950/40', iconColor: 'text-purple-600 dark:text-purple-400' },
          { label: 'Global Rank', value: `#${stats.globalRank}`, trend: 'Based on XP leaderboard', icon: Users, trendColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-sky-100 dark:bg-sky-950/40', iconColor: 'text-sky-600 dark:text-sky-400' },
        ].map(({ label, value, trend, icon: Icon, trendColor, iconBg, iconColor }) => (
          <div key={label} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon size={17} className={iconColor} />
              </div>
              <TrendingUp size={13} className="text-emerald-500 mt-1" />
            </div>
            <p className="font-display font-extrabold text-2xl text-slate-800 dark:text-white leading-none">{value}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-1">{label}</p>
            <p className={`text-[10px] ${trendColor} font-semibold mt-2 flex items-center gap-1`}>{trend}</p>
          </div>
        ))}
      </div>

      {/* ── Modules + Recent Activity ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Modules Grid */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-purple-500 to-violet-700 inline-block" />
              AI Learning Modules
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MODULES.map(({ path, label, icon: Icon, desc, gradient, lightBg, border, tag }) => (
              <Link key={path} to={path}
                className={`group relative flex flex-col p-4 rounded-xl border ${border} ${lightBg} hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}>
                {/* Subtle top gradient strip */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md flex-shrink-0`}>
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">{tag}</span>
                <p className="font-display font-bold text-xs text-slate-800 dark:text-white leading-tight mb-1">{label}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed flex-1">{desc}</p>
                <div className="mt-3 flex items-center gap-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Open <ChevronRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-1 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 dark:border-zinc-800/60">
            <p className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Clock size={13} className="text-purple-500" />Recent Activity
            </p>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Last 7 days</span>
          </div>
          <div className="divide-y divide-slate-100/80 dark:divide-zinc-800/50 font-sans">
            {analyticsData?.quizScores?.length > 0 ? (
              analyticsData.quizScores.slice(-4).reverse().map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-purple-50/30 dark:hover:bg-zinc-800/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle size={14} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">{item.subject} Quiz</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{item.date}</span>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">{item.score}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-500">
                No recent activity study logs found.
              </div>
            )}
          </div>

          {/* Subject performance strip */}
          <div className="px-5 py-4 border-t border-slate-100/80 dark:border-zinc-800/60">
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Award size={11} className="text-purple-500" />Subject Mastery
            </p>
            <div className="space-y-2.5">
              {(analyticsData?.subjectProgress || []).map(({ subject, progress, color }) => (
                <div key={subject}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-600 dark:text-zinc-300 font-medium">{subject}</span>
                    <span className="text-slate-400 dark:text-zinc-500 font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-zinc-800/60 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Connected Devices (Premium Only) ─────────────────────────── */}
      {profile?.isPremium && sessions.length > 0 && (
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100/80 dark:border-zinc-800/50 pb-3">
            <p className="font-display font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 inline-block" />
              Connected Devices
            </p>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/40">
              Session Limit: {sessions.length} / 2 active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session, i) => (
              <div key={session.sessionId || i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400">
                    {/mobile|android|iphone|ipad/i.test(session.os || '') ? (
                      <Smartphone size={18} />
                    ) : (
                      <Monitor size={18} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        {session.deviceName || 'Unknown Device'}
                      </p>
                      {session.isCurrent && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                      IP: {session.ip || 'Unknown'} • Last active: {new Date(session.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default function Dashboard({ theme, toggleTheme }) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    try {
      const orderData = await api.post('/payment/order');
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Self Ranker',
        image: LOGO_BASE64,
        description: 'Upgrade for advanced AI features',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyData = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyData.success) {
              alert('Payment verified! Your account has been upgraded.');
              setProfile(verifyData.user);
            }
          } catch (err) {
            alert('Verification failed: ' + err.message);
          }
        },
        prefill: {
          name: profile?.name || '',
          email: profile?.email || ''
        },
        theme: {
          color: '#7c3aed'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Failed to start checkout: ' + err.message);
    }
  };

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/auth/profile');
        setProfile(data.user);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const isMobile = windowWidth < 768;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => windowWidth < 768);

  // On mobile sidebar is always a drawer (no margin push)
  const marginLeft = isMobile ? '0' : sidebarCollapsed ? '70px' : '240px';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} isMobile={isMobile} />
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft }}
      >
        <DashboardHeader profile={profile} theme={theme} toggleTheme={toggleTheme} onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onProfileUpdate={setProfile} />
        <main className="flex-1 p-5 md:p-6">
          <UsageProvider onUpgrade={handleUpgrade}>
            <Routes>
              <Route index element={<DashboardOverview profile={profile} onUpgrade={handleUpgrade} />} />
              <Route path="ai-notes" element={<AINotes />} />
              <Route path="ai-quiz" element={<AIQuiz />} />
              <Route path="ai-qa" element={<AIQA />} />
              <Route path="supreme-learning" element={<SupremeLearning />} />
              <Route path="ai-tutor" element={<AITutor />} />
              <Route path="gamification" element={<Gamification />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="learning-path" element={<LearningPath />} />
              <Route path="settings" element={<AccountSettings onProfileUpdate={setProfile} />} />
            </Routes>
          </UsageProvider>
        </main>
      </div>
    </div>
  );
}
