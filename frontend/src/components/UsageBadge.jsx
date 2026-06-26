import React from 'react';
import { Infinity as InfinityIcon, Zap } from 'lucide-react';

const FEATURE_PERIOD = {
  notes: 'month',
  quiz: 'day',
  qa: 'day',
  supreme: 'day'
};

/**
 * UsageBadge
 * Shows "X / Y today" or "Unlimited" for the given feature.
 * Props:
 *   feature  - 'notes' | 'quiz' | 'qa' | 'supreme'
 *   used     - number
 *   limit    - number | null (null = unlimited)
 *   compact  - boolean (tiny inline version)
 */
export default function UsageBadge({ feature, used = 0, limit = null, compact = false }) {
  const period = FEATURE_PERIOD[feature];
  const isUnlimited = limit === null || limit === Infinity;
  const near = !isUnlimited && limit > 0 && (limit - used) <= Math.ceil(limit * 0.2); // within 20% of limit
  const exhausted = !isUnlimited && used >= limit;

  const remaining = Math.max(0, limit - used);

  if (compact) {
    if (isUnlimited) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <InfinityIcon size={10} /> Unlimited
        </span>
      );
    }
    const label = feature === 'notes'
      ? (exhausted ? 'Limit reached' : `${remaining} left`)
      : `${used}/${limit} ${period}`;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
        ${exhausted
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400'
          : near
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400'
          : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-800/40 text-purple-600 dark:text-purple-400'
        }`}>
        <Zap size={10} /> {label}
      </span>
    );
  }

  if (isUnlimited) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
        <InfinityIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Unlimited</span>
      </div>
    );
  }

  let normalLabel = '';
  if (feature === 'notes') {
    normalLabel = exhausted ? 'Monthly note download limit reached' : `${remaining}/${limit} downloads remaining this month`;
  } else if (feature === 'quiz') {
    normalLabel = exhausted ? 'Daily quiz limit reached' : `${remaining}/${limit} quizzes remaining today`;
  } else if (feature === 'qa') {
    normalLabel = exhausted ? 'Daily Q&A limit reached' : `${remaining}/${limit} Q&A remaining today`;
  } else if (feature === 'supreme') {
    normalLabel = exhausted ? 'Daily Supreme Learning limit reached' : `${remaining}/${limit} sessions remaining today`;
  } else {
    normalLabel = exhausted ? `Limit reached (${limit}/${period})` : `${remaining} of ${limit} remaining this ${period}`;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold
      ${exhausted
        ? 'bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/40'
        : near
        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40'
        : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-800/40'
      }`}>
      <Zap size={13} className={
        exhausted ? 'text-red-500' : near ? 'text-amber-500' : 'text-purple-500'
      } />
      <span className={
        exhausted ? 'text-red-700 dark:text-red-300'
        : near ? 'text-amber-700 dark:text-amber-300'
        : 'text-purple-700 dark:text-purple-300'
      }>
        {normalLabel}
      </span>
    </div>
  );
}
