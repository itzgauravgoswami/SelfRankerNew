import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Zap, Lock, TrendingUp, Award, Users } from 'lucide-react';
import { api } from '../../utils/api';

const BADGES = [
  { id: 'first_login', icon: '🌟', title: 'First Step', desc: 'Logged in for the first time', xpReq: 0, unlocked: true },
  { id: 'streak_3', icon: '🔥', title: 'Streak Starter', desc: 'Maintained a 3-day streak', xpReq: 150, unlocked: false },
  { id: 'first_notes', icon: '📝', title: 'Note Taker', desc: 'Generated your first AI notes', xpReq: 100, unlocked: false },
  { id: 'quiz_5', icon: '⚡', title: 'Quiz Enthusiast', desc: 'Completed 5 quizzes', xpReq: 300, unlocked: false },
  { id: 'score_90', icon: '🏆', title: 'Top Ranker', desc: 'Scored 90%++ in a quiz', xpReq: 500, unlocked: false },
  { id: 'sessions_10', icon: '📚', title: 'Knowledge Seeker', desc: 'Completed 10 study sessions', xpReq: 800, unlocked: false },
  { id: 'tutor_chat', icon: '🤖', title: 'AI Learner', desc: 'Used AI Tutor for the first time', xpReq: 200, unlocked: false },
  { id: 'path_created', icon: '🗺️', title: 'Path Maker', desc: 'Created your first learning path', xpReq: 250, unlocked: false },
  { id: 'perfect_score', icon: '💯', title: 'Perfectionist', desc: 'Got 100% in any quiz', xpReq: 1000, unlocked: false },
  { id: 'legend', icon: '👑', title: 'Legend', desc: 'Reached Level 5 — The ultimate rank', xpReq: 5000, unlocked: false },
  { id: 'subject_master', icon: '🎓', title: 'Subject Master', desc: 'Studied 5 different subjects', xpReq: 600, unlocked: false },
  { id: 'night_owl', icon: '🦉', title: 'Night Owl', desc: 'Studied after 10 PM', xpReq: 50, unlocked: false },
];

const LEVELS = [
  { level: 1, title: 'Novice', minXp: 0, maxXp: 500, color: 'from-gray-400 to-gray-500' },
  { level: 2, title: 'Scholar', minXp: 500, maxXp: 1500, color: 'from-blue-400 to-blue-600' },
  { level: 3, title: 'Expert', minXp: 1500, maxXp: 3000, color: 'from-purple-500 to-violet-600' },
  { level: 4, title: 'Master', minXp: 3000, maxXp: 5000, color: 'from-amber-400 to-orange-500' },
  { level: 5, title: 'Legend', minXp: 5000, maxXp: Infinity, color: 'from-yellow-400 to-amber-500' },
];

const getHighestBadge = (xp) => {
  const sortedBadges = [...BADGES].sort((a, b) => b.xpReq - a.xpReq);
  const highest = sortedBadges.find(b => xp >= b.xpReq);
  return highest ? `${highest.icon} ${highest.title}` : '🌟 First Step';
};

const checkBadgeUnlocked = (badge, profile, statsSummary, analytics, totalSessions) => {
  const userXp = profile?.xp || 0;
  
  if (userXp < badge.xpReq) return false;

  switch (badge.id) {
    case 'first_login':
      return true;
    case 'streak_3':
      return (profile?.streak || 1) >= 3;
    case 'first_notes':
      return totalSessions >= 1;
    case 'quiz_5':
      return (statsSummary?.quizzesDone || 0) >= 5;
    case 'score_90':
      return (analytics?.quizScores || []).some(q => q.score >= 90);
    case 'sessions_10':
      return totalSessions >= 10;
    case 'tutor_chat':
      return totalSessions >= 1;
    case 'path_created':
      return true;
    case 'perfect_score':
      return (analytics?.quizScores || []).some(q => q.score === 100);
    case 'legend':
      return userXp >= 5000;
    case 'subject_master':
      return (analytics?.subjectProgress || []).filter(s => s.progress > 0).length >= 5;
    case 'night_owl':
      return userXp >= 50;
    default:
      return true;
  }
};

export default function Gamification() {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsSummary, setStatsSummary] = useState({ quizzesDone: 23 });

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        const [profileData, leaderboardData, analyticsData] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/data/leaderboard'),
          api.get('/data/analytics')
        ]);
        setProfile(profileData.user);
        setLeaderboard(leaderboardData);
        setSubjectProgress(analyticsData.subjectProgress || []);
        setAnalytics(analyticsData);
        setStatsSummary({
          quizzesDone: analyticsData.quizScores?.length || 0
        });
      } catch (err) {
        console.error('Failed to load gamification stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGamificationData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const userXp = profile?.xp || 0;
  const currentLevel = LEVELS.find(l => userXp >= l.minXp && userXp < l.maxXp) || LEVELS[LEVELS.length - 1];
  const nextLevel = LEVELS[currentLevel.level] || null;
  const xpInLevel = userXp - currentLevel.minXp;
  const xpForNext = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1;
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpForNext) * 100));

  const totalSessions = analytics?.weeklyActivity?.reduce((sum, item) => sum + item.sessions, 0) || 0;
  const processedBadges = BADGES.map(badge => ({
    ...badge,
    unlocked: checkBadgeUnlocked(badge, profile, statsSummary, analytics, totalSessions)
  }));
  const earnedBadgesCount = processedBadges.filter(b => b.unlocked).length;

  const globalRank = leaderboard.find(item => item.isUser)?.rank || '-';

  const statsList = [
    { label: 'Day Streak', value: `${profile?.streak || 1} days`, icon: Flame, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500' },
    { label: 'Quizzes Done', value: statsSummary.quizzesDone.toString(), icon: Trophy, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30', iconColor: 'text-yellow-500' },
    { label: 'Badges Earned', value: `${earnedBadgesCount} / ${BADGES.length}`, icon: Award, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-500' },
    { label: 'Global Rank', value: `#${globalRank}`, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Nav */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl w-fit max-w-full">
        {[['overview', 'Overview'], ['badges', 'Badges'], ['leaderboard', 'Leaderboard']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === id ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25' : 'text-slate-600 dark:text-zinc-400 hover:text-purple-700 dark:hover:text-purple-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Level Card */}
          <div className="md:col-span-2 xl:col-span-1 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-4 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-4">Your Level</p>
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center shadow-lg`}>
                <span className="text-2xl font-black text-white">{currentLevel.level}</span>
              </div>
              <div>
                <p className="font-display font-bold text-xl text-slate-800 dark:text-white">{currentLevel.title}</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">{userXp.toLocaleString()} XP total</p>
              </div>
            </div>
            {nextLevel && (
              <>
                <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 mb-2">
                  <span>Progress to {nextLevel.title}</span>
                  <span>{xpPercent}%</span>
                </div>
                <div className="w-full h-3 bg-purple-100 dark:bg-zinc-800/60 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full transition-all duration-700`} style={{ width: `${xpPercent}%` }} />
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">{nextLevel.minXp - userXp} XP to next level</p>
              </>
            )}
          </div>

          {/* Stats Grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {statsList.map(({ label, value, icon: Icon, color, iconColor }) => (
              <div key={label} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon size={22} className={iconColor} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{label}</p>
                  <p className="font-display font-bold text-xl text-slate-800 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Subject Progress */}
          <div className="md:col-span-2 xl:col-span-3 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-4 sm:p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" />Subject Mastery
            </p>
            <div className="space-y-4">
              {subjectProgress.map(({ subject, progress, color }) => (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-zinc-200">{subject}</span>
                    <span className="text-slate-500 dark:text-zinc-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-purple-50 dark:bg-zinc-800/60 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {processedBadges.map(badge => (
            <div key={badge.id}
              className={`relative bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border rounded-2xl p-4 text-center shadow-sm transition-all duration-200 flex flex-col items-center gap-2
                ${badge.unlocked ? 'border-purple-200/70 dark:border-purple-800/40 hover:shadow-md hover:shadow-purple-500/10' : 'border-purple-100/40 dark:border-zinc-800/40 opacity-60'}`}>
              <div className={`text-3xl ${!badge.unlocked ? 'grayscale opacity-50' : ''}`}>{badge.icon}</div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-tight">{badge.title}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">{badge.desc}</p>
              {!badge.unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock size={11} className="text-slate-400 dark:text-zinc-600" />
                </div>
              )}
              {!badge.unlocked && (
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">{badge.xpReq} XP needed</span>
              )}
              {badge.unlocked && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">✓ Unlocked</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-purple-100/50 dark:border-zinc-800/50">
            <p className="font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users size={16} className="text-purple-500" />Global Leaderboard
            </p>
          </div>
          <div className="divide-y divide-purple-100/30 dark:divide-zinc-800/40">
            {leaderboard.map(({ rank, name, xp, level, avatarUrl, isUser }) => {
              const userBadge = getHighestBadge(xp);
              return (
                <div key={rank}
                  className={`flex items-center gap-4 px-4 sm:px-6 py-4 transition-colors ${isUser ? 'bg-purple-50/70 dark:bg-purple-950/20' : 'hover:bg-purple-50/30 dark:hover:bg-zinc-800/30'}`}>
                  <div className={`w-8 text-center font-display font-bold text-sm ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-500' : rank === 3 ? 'text-amber-600' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${isUser ? 'bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-md shadow-purple-500/25' : 'bg-purple-100 dark:bg-zinc-800/60 text-purple-700 dark:text-purple-300'} overflow-hidden`}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isUser ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-zinc-100'}`}>
                      {name} {isUser && <span className="text-[10px] font-normal text-purple-500 ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Level {level} · {userBadge}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{xp.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
