/**
 * usageLimits.js
 * Shared constants and helpers for subscription-based usage limits.
 */

export const LIMITS = {
  free: {
    notes: 10,         // per month
    quiz: 5,           // per day
    qa: 5,             // per day
    supreme: 5,        // per day
    learningPlans: 5   // active simultaneously
  },
  premium: {
    notes: Infinity,
    quiz: Infinity,
    qa: Infinity,
    supreme: Infinity,
    learningPlans: 10
  }
};

export const MAX_DEVICES = {
  free: 1,
  premium: 2
};

/**
 * Returns true if `date` is a different calendar day from today (UTC).
 */
function isNewDay(date) {
  if (!date) return true;
  const now = new Date();
  const d = new Date(date);
  return (
    now.getUTCFullYear() !== d.getUTCFullYear() ||
    now.getUTCMonth() !== d.getUTCMonth() ||
    now.getUTCDate() !== d.getUTCDate()
  );
}

/**
 * Returns true if `date` is a different calendar month from today (UTC).
 */
function isNewMonth(date) {
  if (!date) return true;
  const now = new Date();
  const d = new Date(date);
  return (
    now.getUTCFullYear() !== d.getUTCFullYear() ||
    now.getUTCMonth() !== d.getUTCMonth()
  );
}

/**
 * Reset daily counters (quiz, qa, supreme) if the last reset was a prior day.
 * Mutates the user.usage object. Caller must save the user.
 */
export function resetDailyCountersIfNeeded(user) {
  const usage = user.usage || {};
  const now = new Date();

  if (isNewDay(usage.quizResetDate)) {
    usage.quizCountToday = 0;
    usage.quizResetDate = now;
  }
  if (isNewDay(usage.qaResetDate)) {
    usage.qaCountToday = 0;
    usage.qaResetDate = now;
  }
  if (isNewDay(usage.supremeResetDate)) {
    usage.supremeCountToday = 0;
    usage.supremeResetDate = now;
  }
  user.usage = usage;
}

/**
 * Reset monthly note download counter if the last reset was a prior month.
 * Mutates the user.usage object. Caller must save the user.
 */
export function resetMonthlyCountersIfNeeded(user) {
  const usage = user.usage || {};
  if (isNewMonth(usage.notesResetDate)) {
    usage.notesDownloadCount = 0;
    usage.notesResetDate = new Date();
  }
  user.usage = usage;
}

/**
 * Check whether the user can use a feature.
 * Returns { allowed, used, limit, remaining, resetAt }.
 */
export function checkLimit(user, feature) {
  const tier = user.isPremium ? 'premium' : 'free';
  const limit = LIMITS[tier][feature];

  let used = 0;
  let resetAt = null;

  switch (feature) {
    case 'notes':
      used = user.usage?.notesDownloadCount || 0;
      resetAt = nextMonthStart();
      break;
    case 'quiz':
      used = user.usage?.quizCountToday || 0;
      resetAt = nextMidnight();
      break;
    case 'qa':
      used = user.usage?.qaCountToday || 0;
      resetAt = nextMidnight();
      break;
    case 'supreme':
      used = user.usage?.supremeCountToday || 0;
      resetAt = nextMidnight();
      break;
    default:
      return { allowed: true, used: 0, limit: Infinity, remaining: Infinity, resetAt: null };
  }

  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  const allowed = limit === Infinity || used < limit;

  return { allowed, used, limit, remaining, resetAt };
}

/**
 * Increment a usage counter for a feature. Returns the updated limit check result.
 * Does NOT save the user — caller must await user.save().
 */
export function incrementUsage(user, feature) {
  if (!user.usage) user.usage = {};

  switch (feature) {
    case 'notes':
      user.usage.notesDownloadCount = (user.usage.notesDownloadCount || 0) + 1;
      if (!user.usage.notesResetDate) user.usage.notesResetDate = new Date();
      break;
    case 'quiz':
      user.usage.quizCountToday = (user.usage.quizCountToday || 0) + 1;
      user.usage.quizResetDate = user.usage.quizResetDate || new Date();
      break;
    case 'qa':
      user.usage.qaCountToday = (user.usage.qaCountToday || 0) + 1;
      user.usage.qaResetDate = user.usage.qaResetDate || new Date();
      break;
    case 'supreme':
      user.usage.supremeCountToday = (user.usage.supremeCountToday || 0) + 1;
      user.usage.supremeResetDate = user.usage.supremeResetDate || new Date();
      break;
  }
  user.markModified('usage');
  return checkLimit(user, feature);
}

function nextMidnight() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

function nextMonthStart() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
