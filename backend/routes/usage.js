/**
 * routes/usage.js
 * Endpoints for checking and incrementing feature usage limits.
 */

import express from 'express';
import authMiddleware from '../authMiddleware.js';
import User from '../models/User.js';
import {
  resetDailyCountersIfNeeded,
  resetMonthlyCountersIfNeeded,
  checkLimit,
  incrementUsage,
  LIMITS
} from '../usageLimits.js';

const router = express.Router();

// Helper to build a full status response for all features
function buildStatusResponse(user) {
  const isPremium = user.isPremium;
  const tier = isPremium ? 'premium' : 'free';

  return {
    isPremium,
    tier,
    features: {
      notes: checkLimit(user, 'notes'),
      quiz: checkLimit(user, 'quiz'),
      qa: checkLimit(user, 'qa'),
      supreme: checkLimit(user, 'supreme')
    },
    limits: LIMITS[tier]
  };
}

// GET /api/usage/status — full usage status for current user
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    resetDailyCountersIfNeeded(user);
    resetMonthlyCountersIfNeeded(user);
    await user.save();

    res.json(buildStatusResponse(user));
  } catch (err) {
    console.error('Usage status error:', err);
    res.status(500).json({ error: 'Failed to load usage status.' });
  }
});

// Generic increment handler
async function handleIncrement(req, res, feature) {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Reset counters if period has lapsed
    resetDailyCountersIfNeeded(user);
    resetMonthlyCountersIfNeeded(user);

    // Check BEFORE incrementing
    const check = checkLimit(user, feature);
    if (!check.allowed) {
      return res.status(429).json({
        allowed: false,
        used: check.used,
        limit: check.limit,
        remaining: 0,
        resetAt: check.resetAt,
        isPremium: user.isPremium,
        limitReached: true,
        message: user.isPremium
          ? `Premium limit reached.`
          : `Free plan limit reached. Upgrade to Premium for unlimited ${feature} access.`
      });
    }

    // Increment
    const updated = incrementUsage(user, feature);
    await user.save();

    res.json({
      allowed: true,
      used: updated.used,
      limit: updated.limit,
      remaining: updated.remaining,
      resetAt: updated.resetAt,
      isPremium: user.isPremium
    });
  } catch (err) {
    console.error(`Usage increment error (${feature}):`, err);
    res.status(500).json({ error: 'Failed to update usage.' });
  }
}

// POST /api/usage/notes/increment
router.post('/notes/increment', authMiddleware, (req, res) => handleIncrement(req, res, 'notes'));

// POST /api/usage/quiz/increment
router.post('/quiz/increment', authMiddleware, (req, res) => handleIncrement(req, res, 'quiz'));

// POST /api/usage/qa/increment
router.post('/qa/increment', authMiddleware, (req, res) => handleIncrement(req, res, 'qa'));

// POST /api/usage/supreme/increment
router.post('/supreme/increment', authMiddleware, (req, res) => handleIncrement(req, res, 'supreme'));

export default router;
