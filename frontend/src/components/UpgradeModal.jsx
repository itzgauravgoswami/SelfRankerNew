import React from 'react';
import { X, Sparkles, Infinity as InfinityIcon, CheckCircle2, Zap, Star } from 'lucide-react';

const PREMIUM_BENEFITS = [
  { icon: '📝', label: 'Unlimited AI Notes downloads' },
  { icon: '🎯', label: 'Unlimited AI Quizzes per day' },
  { icon: '💬', label: 'Unlimited AI Q&A tests per day' },
  { icon: '🎬', label: 'Unlimited Supreme Learning sessions' },
  { icon: '🗺️', label: 'Up to 10 active Learning Paths' },
  { icon: '📱', label: 'Up to 2 simultaneous active devices' },
  { icon: '📊', label: 'Full analytics history & mastery metrics' },
  { icon: '⚡', label: 'Priority AI generation queue' },
];

const FEATURE_LABELS = {
  notes: 'AI Notes',
  quiz: 'AI Quiz',
  qa: 'AI Q&A',
  supreme: 'Supreme Learning',
  learningPlans: 'Learning Paths'
};

const FEATURE_RESET = {
  notes: 'monthly',
  quiz: 'daily',
  qa: 'daily',
  supreme: 'daily',
  learningPlans: null
};

export default function UpgradeModal({ isOpen, onClose, onUpgrade, feature, used, limit }) {
  if (!isOpen) return null;

  const featureLabel = FEATURE_LABELS[feature] || 'this feature';
  const resetPeriod = FEATURE_RESET[feature];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Glass card */}
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,240,255,0.98) 100%)',
        }}>

        {/* Dark mode */}
        <div className="dark:hidden absolute inset-0 rounded-3xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,240,255,0.98) 100%)' }} />
        <div className="hidden dark:block absolute inset-0 rounded-3xl"
          style={{ background: 'linear-gradient(135deg, rgba(10,8,20,0.97) 0%, rgba(18,12,35,0.98) 100%)' }} />

        {/* Ambient glow blobs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-400/20 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6">
          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/70 transition-all">
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
              <Sparkles size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
              Upgrade to Premium
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5 font-sans">
              Unlock unlimited access to all features
            </p>
          </div>

          {/* Limit Reached Banner */}
          {feature && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 flex items-start gap-3">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {featureLabel} limit reached
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  {limit !== null ? (
                    <>You've used <strong>{used}</strong> of <strong>{limit}</strong>{resetPeriod ? ` ${resetPeriod}` : ''} {featureLabel.toLowerCase()} allowances.</>
                  ) : (
                    <>You've reached the maximum number of active {featureLabel.toLowerCase()}.</>
                  )}
                  {' '}Upgrade for unlimited access.
                </p>
              </div>
            </div>
          )}

          {/* Benefits list */}
          <div className="space-y-2 mb-6">
            {PREMIUM_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40">
                <span className="text-lg leading-none flex-shrink-0">{b.icon}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">{b.label}</span>
                <CheckCircle2 size={14} className="text-emerald-500 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="text-center mb-5">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-display">₹21</span>
            <span className="text-sm text-slate-500 dark:text-zinc-400 ml-1">/month</span>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Cancel anytime. 14-day money-back guarantee.</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onUpgrade?.(); onClose?.(); }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 font-display">
            <Star size={18} />
            Upgrade Now — ₹21/month
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2.5 py-2.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
