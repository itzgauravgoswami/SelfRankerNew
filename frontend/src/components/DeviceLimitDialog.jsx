import React, { useState } from 'react';
import { Smartphone, Monitor, AlertTriangle, LogIn, Shield, Check } from 'lucide-react';

function formatTimeAgo(date) {
  if (!date) return 'Unknown';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function DeviceLimitDialog({ isOpen, plan, maxDevices, activeSessions = [], onContinue, onCancel }) {
  if (!isOpen) return null;

  const isPremiumLimit = plan === 'premium';
  
  // Set default selected session to the oldest session (first in array or sorted)
  const sortedSessions = [...activeSessions].sort((a, b) => new Date(a.loginTime) - new Date(b.loginTime));
  const [selectedSessionId, setSelectedSessionId] = useState(
    sortedSessions[0]?.sessionId || null
  );

  const handleContinue = () => {
    onContinue(selectedSessionId);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-orange-200/60 dark:border-orange-900/40 shadow-2xl overflow-hidden">

        {/* Ambient top glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />

        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center mb-3">
              <AlertTriangle size={24} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
              {isPremiumLimit ? 'Maximum Device Limit Reached' : 'Device Limit Reached'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
              {isPremiumLimit
                ? `Your Premium plan allows up to ${maxDevices} active devices. Please select a device to sign out:`
                : `Your account is already active on another device. Continuing will sign out the active device.`}
            </p>
          </div>

          {/* Active devices list */}
          {activeSessions.length > 0 && (
            <div className="mb-5 space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield size={11} />
                {isPremiumLimit ? 'Select Device to Evict' : 'Currently Active Device'}
              </p>
              {activeSessions.map((session) => {
                const isSelected = selectedSessionId === session.sessionId;
                const isSelectable = isPremiumLimit;

                return (
                  <div
                    key={session.sessionId}
                    onClick={() => isSelectable && setSelectedSessionId(session.sessionId)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200
                      ${isSelectable ? 'cursor-pointer' : ''}
                      ${isSelected
                        ? 'bg-purple-50/75 dark:bg-purple-950/20 border-purple-500/80 shadow-md shadow-purple-500/10'
                        : 'bg-slate-50 dark:bg-zinc-800/50 border-slate-200/60 dark:border-zinc-700/50 hover:bg-slate-100/70 dark:hover:bg-zinc-800/80'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-zinc-700 text-slate-500'}`}
                    >
                      {/mobile|android|iphone|ipad/i.test(session.os || '')
                        ? <Smartphone size={15} />
                        : <Monitor size={15} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">
                        {session.deviceName || 'Unknown Device'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        Last active: {formatTimeAgo(session.lastActive)}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700/70 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={isPremiumLimit && !selectedSessionId}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <LogIn size={15} />
              Continue Login
            </button>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-zinc-600 text-center mt-3">
            {isPremiumLimit ? 'The selected session will be signed out.' : 'The active session will be signed out.'}
          </p>
        </div>
      </div>
    </div>
  );
}
