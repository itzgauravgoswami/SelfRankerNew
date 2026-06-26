import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, Target, BookOpen, Zap, Award, AlertTriangle } from 'lucide-react';
import { api } from '../../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-purple-100/70 dark:border-zinc-800/60 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-semibold text-slate-700 dark:text-zinc-200 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value}{typeof p.value === 'number' && p.name === 'Score' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState({
    quizScores: [],
    weeklyActivity: [],
    subjectProgress: [],
    loading: true
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/data/analytics');
        
        setData({
          quizScores: res.quizScores || [],
          weeklyActivity: res.weeklyActivity || [],
          subjectProgress: res.subjectProgress || [],
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchAnalytics();
  }, []);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Calculate dynamic stats
  const totalSessions = data.weeklyActivity.reduce((sum, item) => sum + item.sessions, 0);
  const totalQuestions = data.weeklyActivity.reduce((sum, item) => sum + item.questions, 0);
  const avgQuizScore = data.quizScores.length
    ? Math.round(data.quizScores.reduce((sum, item) => sum + item.score, 0) / data.quizScores.length)
    : 0;

  // Dynamic Subject Study Hours based on progress
  const SUBJECT_TIME = data.subjectProgress.map(p => ({
    subject: p.subject,
    hours: Math.round(p.progress * 0.2),
    color: p.color === 'bg-purple-500' ? '#6d28d9' :
           p.color === 'bg-indigo-500' ? '#8b5cf6' :
           p.color === 'bg-green-500' ? '#10b981' :
           p.color === 'bg-pink-500' ? '#ec4899' : '#f59e0b'
  }));

  // Dynamic Strengths array
  const STRENGTH_DATA = data.subjectProgress.map(p => ({
    subject: p.subject,
    score: p.progress
  }));

  // Dynamic Performance breakdown percentages
  const quizCount = data.quizScores.length;
  let strongPercent = 0;
  let averagePercent = 0;
  let workPercent = 0;

  if (quizCount > 0) {
    const scores = data.quizScores.map(q => q.score);
    const strongCount = scores.filter(s => s >= 85).length;
    const averageCount = scores.filter(s => s >= 60 && s < 85).length;
    const workCount = scores.filter(s => s < 60).length;

    strongPercent = Math.max(5, Math.round((strongCount / quizCount) * 100));
    averagePercent = Math.max(5, Math.round((averageCount / quizCount) * 100));
    workPercent = Math.max(0, 100 - strongPercent - averagePercent);
  }

  const PERFORMANCE_DONUT = [
    { name: 'Strong', value: strongPercent, color: '#10b981' },
    { name: 'Average', value: averagePercent, color: '#f59e0b' },
    { name: 'Needs Work', value: workPercent, color: '#ef4444' },
  ];

  const weakTopicsCount = data.subjectProgress.filter(s => s.progress > 0 && s.progress < 60).length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Study Sessions', value: totalSessions.toLocaleString(), change: 'Updated live', positive: true, icon: BookOpen, color: 'from-purple-500 to-violet-700' },
          { label: 'Questions Done', value: totalQuestions.toLocaleString(), change: 'Updated live', positive: true, icon: Zap, color: 'from-indigo-500 to-purple-600' },
          { label: 'Avg Quiz Score', value: `${avgQuizScore}%`, change: 'Based on quizzes', positive: true, icon: Award, color: 'from-violet-500 to-purple-700' },
          { label: 'Weak Topics', value: weakTopicsCount.toString(), change: 'Updated live', positive: true, icon: Target, color: 'from-purple-600 to-indigo-700' },
        ].map(({ label, value, change, positive, icon: Icon, color }) => (
          <div key={label} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md shadow-purple-500/20`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-0.5">{label}</p>
            <p className="font-display font-bold text-xl text-slate-800 dark:text-white">{value}</p>
            <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Score Trend */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
          <p className="font-semibold text-sm text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-purple-500" />Quiz Score Trend
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.quizScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" name="Score" stroke="#8b5cf6" strokeWidth={3} dot={{ stroke: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
          <p className="font-semibold text-sm text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <BarChart2 size={15} className="text-purple-500" />Weekly Activity
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.weeklyActivity} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="questions" name="Questions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="sessions" name="Sessions" fill="#c4b5fd" radius={[6, 6, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Time Distribution */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
          <p className="font-semibold text-sm text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <BookOpen size={15} className="text-purple-500" />Time Per Subject (Hours)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SUBJECT_TIME} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis dataKey="subject" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" name="Hours" radius={[0, 6, 6, 0]}>
                {SUBJECT_TIME.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Donut */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
          <p className="font-semibold text-sm text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <Target size={15} className="text-purple-500" />Overall Performance Breakdown
          </p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={PERFORMANCE_DONUT} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {PERFORMANCE_DONUT.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '']} contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {PERFORMANCE_DONUT.map(({ name, value, color }) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-600 dark:text-zinc-400">{name}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 ml-auto">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Best Subjects */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-green-200/50 dark:border-green-800/30 rounded-2xl p-5 shadow-sm">
          <p className="font-semibold text-sm text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
            <TrendingUp size={15} />Best Performing Subjects
          </p>
          <div className="space-y-3">
            {STRENGTH_DATA.sort((a, b) => b.score - a.score).slice(0, 3).map(({ subject, score }) => (
              <div key={subject} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 w-24">{subject}</span>
                <div className="flex-1 h-2 bg-green-100 dark:bg-green-950/30 rounded-full">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 w-10 text-right">{score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-red-200/50 dark:border-red-800/30 rounded-2xl p-5 shadow-sm">
          <p className="font-semibold text-sm text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} />Subjects Needing Focus
          </p>
          <div className="space-y-3">
            {STRENGTH_DATA.sort((a, b) => a.score - b.score).slice(0, 3).map(({ subject, score }) => (
              <div key={subject} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 w-24">{subject}</span>
                <div className="flex-1 h-2 bg-red-100 dark:bg-red-950/30 rounded-full">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400 w-10 text-right">{score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
