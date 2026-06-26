import React, { useState, useEffect } from 'react';
import { Map, Plus, Sparkles, RefreshCw, AlertCircle, Trash2, ChevronDown, ChevronUp, CheckSquare, Square, ChevronRight, BookOpen, Target, Archive } from 'lucide-react';
import { api } from '../../utils/api';
import { useUsage } from '../../context/UsageContext';
import UpgradeModal from '../../components/UpgradeModal';

const formatMarkdown = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    const subParts = part.split(/(\*.*?\*)/g);
    return subParts.map((subPart, subIndex) => {
      if (subPart.startsWith('*') && subPart.endsWith('*')) {
        return <em key={`${index}-${subIndex}`} className="italic">{subPart.slice(1, -1)}</em>;
      }
      return subPart;
    });
  });
};

export default function LearningPath() {
  const { isPremium, onUpgrade } = useUsage();
  const [paths, setPaths] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ goal: '', examType: '', timeframe: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedPath, setExpandedPath] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: null });

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const data = await api.get('/data/learning-paths');
        setPaths(data);
      } catch (err) {
        console.error('Failed to fetch learning paths:', err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchPaths();
  }, []);

  const handleGenerate = async () => {
    if (!form.goal.trim()) { setError('Please enter a learning goal.'); return; }
    setError(''); setLoading(true);
    try {
      const result = await api.post('/ai/learning-path', form);

      // Handle plan limit reached response from backend
      if (result.limitReached) {
        setLimitInfo({ used: result.used, limit: result.limit });
        setShowUpgrade(true);
        setLoading(false);
        return;
      }

      const newPath = {
        id: result.id,
        ...result.path,
        goal: form.goal,
        examType: form.examType,
        createdAt: new Date().toLocaleDateString(),
        completedTasks: {},
        archived: false,
      };
      setPaths(p => [newPath, ...p]);
      setShowCreate(false);
      setForm({ goal: '', examType: '', timeframe: '' });
      setExpandedPath(newPath.id);
      
      // Award XP for creating path
      await api.post('/auth/add-xp', { xpToAdd: 100 }).catch(() => {});
    } catch (e) {
      if (e.message && e.message.includes('limit')) {
        const activeCount = paths.filter(p => !p.archived).length;
        const planLimit = isPremium ? 10 : 5;
        setLimitInfo({ used: activeCount, limit: planLimit });
        setShowUpgrade(true);
      } else {
        setError(e.message || 'Failed to generate learning path.');
      }
    }
    finally { setLoading(false); }
  };

  const toggleTask = async (pathId, dayIdx, taskIdx) => {
    const path = paths.find(p => p.id === pathId);
    if (!path) return;

    const key = `${dayIdx}-${taskIdx}`;
    const updatedTasks = { ...path.completedTasks, [key]: !path.completedTasks?.[key] };

    setPaths(ps => ps.map(p => {
      if (p.id !== pathId) return p;
      return { ...p, completedTasks: updatedTasks };
    }));

    try {
      await api.post(`/data/learning-paths/${pathId}/update`, { completedTasks: updatedTasks });
      // Award XP for task checkoff
      await api.post('/auth/add-xp', { xpToAdd: 20 }).catch(() => {});
    } catch (err) {
      console.error('Failed to save task update on server:', err);
    }
  };

  const deletePath = async (pathId) => {
    setPaths(ps => ps.filter(p => p.id !== pathId));
    try {
      await api.delete(`/data/learning-paths/${pathId}`);
    } catch (err) {
      console.error('Failed to delete learning path on server:', err);
    }
  };

  const archivePath = async (pathId) => {
    const path = paths.find(p => p.id === pathId);
    if (!path) return;

    const isArchived = !path.archived;

    setPaths(ps => ps.map(p => {
      if (p.id === pathId) {
        return { ...p, archived: isArchived };
      }
      return p;
    }));

    try {
      await api.post(`/data/learning-paths/${pathId}/update`, { archived: isArchived });
    } catch (err) {
      console.error('Failed to update archive status on server:', err);
    }
  };

  const getPathProgress = (path) => {
    if (!path.days || !path.days.length) return 0;
    const totalTasks = path.days.reduce((sum, d) => sum + (d.tasks?.length || 0), 0);
    if (!totalTasks) return 0;
    const done = Object.values(path.completedTasks || {}).filter(Boolean).length;
    return Math.round((done / totalTasks) * 100);
  };

  const activePaths = paths.filter(p => !p.archived);
  const archivedPaths = paths.filter(p => p.archived);
  const planLimit = isPremium ? 10 : 5;
  const isLimitReached = activePaths.length >= planLimit;

  return (
    <div className="space-y-6">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={onUpgrade}
        feature="learningPlans"
        used={limitInfo.used}
        limit={limitInfo.limit}
      />
      {/* Header + Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-slate-800 dark:text-white">Your Learning Paths</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {activePaths.length} active path{activePaths.length !== 1 ? 's' : ''}
            {' '}<span className="text-purple-500">({isPremium ? '10' : '5'} max)</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={15} /><span>New Path</span>
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm animate-scale-up">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Map size={16} className="text-purple-500" />Create Learning Path
          </h3>

          {isLimitReached && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2 mb-4 animate-pulse-glow">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Active Paths Limit Reached</p>
                <p className="font-normal mt-0.5">
                  You have reached the maximum allowed active learning paths ({planLimit}). Archive or delete an existing roadmap to proceed, or upgrade to Premium.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Learning Goal *</label>
              <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} disabled={isLimitReached}
                placeholder="e.g. Learn DSA in 30 Days, Master Organic Chemistry"
                className="w-full px-3 py-2.5 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Exam Type (optional)</label>
              <input value={form.examType} onChange={e => setForm(f => ({ ...f, examType: e.target.value }))} disabled={isLimitReached}
                placeholder="e.g. JEE, UPSC, GATE"
                className="w-full px-3 py-2.5 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Timeframe (optional)</label>
              <input value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} disabled={isLimitReached}
                placeholder="e.g. 30 days, 3 months"
                className="w-full px-3 py-2.5 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle size={14} /><span>{error}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleGenerate} disabled={loading || isLimitReached}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed">
              {loading ? <><RefreshCw size={15} className="animate-spin" /><span>Generating Path...</span></> : <><Sparkles size={15} /><span>Generate Path</span></>}
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 rounded-xl border border-purple-100/70 dark:border-zinc-700/70 text-slate-600 dark:text-zinc-400 text-sm font-medium hover:bg-purple-50 dark:hover:bg-zinc-800/50 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {paths.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center h-64 bg-white/70 dark:bg-zinc-900/60 border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl text-slate-400 dark:text-zinc-500">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
            <Map size={28} className="text-purple-300 dark:text-purple-700" />
          </div>
          <p className="font-medium text-sm">No learning paths yet</p>
          <p className="text-xs mt-1">Click "New Path" to generate your first AI learning path</p>
        </div>
      )}

      {/* Active Paths */}
      {activePaths.length > 0 && (
        <div className="space-y-4">
          {activePaths.map((path) => {
            const progress = getPathProgress(path);
            const isExpanded = expandedPath === path.id;
            return (
              <div key={path.id} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-purple-100/70 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden">
                {/* Path Header */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-purple-50/30 dark:hover:bg-zinc-800/20 transition-colors"
                  onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                >
                  {/* Progress Ring (SVG) */}
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="5" />
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#8b5cf6" strokeWidth="5"
                        strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 22}`} strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
                        className="transition-all duration-700" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">{progress}%</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-slate-800 dark:text-white truncate">{path.title || path.goal}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {path.examType && <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg">{path.examType}</span>}
                      <span className="text-xs text-slate-500 dark:text-zinc-400">{path.totalDays} days · Created {path.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1">{path.overview}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); archivePath(path.id); }}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all">
                      <Archive size={15} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deletePath(path.id); }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                      <Trash2 size={15} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-purple-100/50 dark:border-zinc-800/50">
                    {/* Milestones */}
                    {path.milestones && path.milestones.length > 0 && (
                      <div className="px-5 py-4 border-b border-purple-100/30 dark:border-zinc-800/30">
                        <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                          <Target size={13} className="text-purple-500" />Milestones
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          {path.milestones.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100/50 dark:border-purple-800/30">
                              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Day {m.day}</span>
                              <span className="text-xs text-slate-600 dark:text-zinc-400">{m.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Day-by-Day Plan */}
                    <div className="px-5 py-4 max-h-[500px] overflow-y-auto">
                      <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-purple-500" />Day-by-Day Plan
                      </p>
                      <div className="space-y-3">
                        {path.days?.map((day, dayIdx) => {
                          const isDayExpanded = expandedDay === `${path.id}-${dayIdx}`;
                          const dayTasks = day.tasks || [];
                          const completedCount = dayTasks.filter((_, tIdx) => path.completedTasks?.[`${dayIdx}-${tIdx}`]).length;
                          return (
                            <div key={dayIdx} className="border border-purple-100/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
                              <button
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50/50 dark:hover:bg-zinc-800/30 transition-colors text-left"
                                onClick={() => setExpandedDay(isDayExpanded ? null : `${path.id}-${dayIdx}`)}
                              >
                                <span className="w-12 text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">Day {day.day}</span>
                                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-200 truncate">{day.title}</span>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{completedCount}/{dayTasks.length} tasks</span>
                                {isDayExpanded ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
                              </button>
                              {isDayExpanded && (
                                <div className="px-4 pb-4 border-t border-purple-100/30 dark:border-zinc-800/30 pt-3 space-y-4">
                                  {day.topics?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Topics</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {day.topics.map((t, i) => (
                                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-100/50 dark:border-purple-800/30">{t}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {dayTasks.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tasks</p>
                                      <div className="space-y-2">
                                        {dayTasks.map((task, tIdx) => {
                                          const done = !!path.completedTasks?.[`${dayIdx}-${tIdx}`];
                                          return (
                                            <button key={tIdx} onClick={() => toggleTask(path.id, dayIdx, tIdx)}
                                              className="w-full flex items-start gap-2.5 text-left group">
                                              {done
                                                ? <CheckSquare size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                                : <Square size={15} className="text-slate-300 dark:text-zinc-600 group-hover:text-purple-400 flex-shrink-0 mt-0.5 transition-colors" />}
                                              <span className={`text-sm ${done ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-700 dark:text-zinc-200'}`}>
                                                {formatMarkdown(task)}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {day.resources?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Resources</p>
                                      <ul className="space-y-1">
                                        {day.resources.map((r, i) => {
                                          let title = '';
                                          let href = '';
                                          
                                          if (r && typeof r === 'object') {
                                            title = r.title || r.name || 'Resource';
                                            href = r.url || r.link || '#';
                                          } else if (typeof r === 'string') {
                                            title = r;
                                            const isLink = r.startsWith('http://') || r.startsWith('https://');
                                            href = isLink ? r : `https://www.google.com/search?q=${encodeURIComponent(r)}`;
                                          } else {
                                            return null;
                                          }
                                          
                                          const isActualLink = href.startsWith('http://') || href.startsWith('https://');
                                          return (
                                            <li key={i} className="text-xs text-slate-600 dark:text-zinc-400 flex items-start gap-1.5">
                                              <span className="text-purple-500 mt-0.5">•</span>
                                              {isActualLink ? (
                                                <a
                                                  href={href}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 font-medium text-left"
                                                >
                                                  {title}
                                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">↗</span>
                                                </a>
                                              ) : (
                                                <span>{title}</span>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archived Paths */}
      {archivedPaths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
            <Archive size={13} />Archived Paths ({archivedPaths.length})
          </p>
          <div className="space-y-2">
            {archivedPaths.map(path => (
              <div key={path.id} className="flex items-center gap-4 px-5 py-3 bg-white/50 dark:bg-zinc-900/40 border border-purple-100/50 dark:border-zinc-800/40 rounded-xl opacity-60">
                <p className="flex-1 text-sm text-slate-600 dark:text-zinc-400 truncate">{path.title || path.goal}</p>
                <button onClick={() => archivePath(path.id)} className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">Restore</button>
                <button onClick={() => deletePath(path.id)} className="p-1.5 rounded-lg hover:text-red-500 transition-colors text-slate-400">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
