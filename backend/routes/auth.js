import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Analytics from '../models/Analytics.js';
import PendingRegistration from '../models/PendingRegistration.js';
import LearningPath from '../models/LearningPath.js';
import authMiddleware from '../authMiddleware.js';
import { MAX_DEVICES } from '../usageLimits.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is not set.');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper: Parse device info from request ──────────────────────────────────
function parseDeviceInfo(req) {
  const ua = req.headers['user-agent'] || '';
  const deviceId = req.headers['x-device-id'] || uuidv4();

  // Simple OS detection
  let os = 'Unknown';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';

  // Simple browser detection
  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  else if (/OPR\/|Opera\//.test(ua)) browser = 'Opera';

  const deviceName = `${browser} on ${os}`;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';

  return { deviceId, deviceName, browser, os, ip };
}

// ─── Helper: Build standardized user profile response ────────────────────────
function buildUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    googleId: user.googleId || null,
    githubId: user.githubId || null,
    microsoftId: user.microsoftId || null,
    xp: user.xp,
    level: user.level,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    examGoal: user.examGoal,
    isPremium: user.isPremium,
    subscription: user.subscription,
    usage: user.usage,
    sessionCount: (user.sessions || []).length,
    notificationPreferences: user.notificationPreferences || {
      streakReminders: true,
      quizResults: true,
      weeklyDigest: false,
      rankUpdates: true
    },
    notifications: (user.notifications || []).slice(-20).reverse() // return last 20 notifications, newest first
  };
}

// ─── Helper: Handle session creation with device limit enforcement ────────────
async function createSession(user, req, res, force = false, evictSessionId = null) {
  const { deviceId, deviceName, browser, os, ip } = parseDeviceInfo(req);
  const tier = user.isPremium ? 'premium' : 'free';
  const maxDevices = MAX_DEVICES[tier];
  
  // Evict any existing session on the same deviceId first (to allow seamless relogin on the same device)
  let activeSessions = (user.sessions || []).filter(s => s.deviceId !== deviceId);

  if (activeSessions.length >= maxDevices && !force) {
    // Return device limit warning — frontend must confirm
    return res.json({
      deviceLimitReached: true,
      plan: tier,
      maxDevices,
      activeSessions: activeSessions.map(s => ({
        sessionId: s.sessionId,
        deviceName: s.deviceName,
        browser: s.browser,
        os: s.os,
        loginTime: s.loginTime,
        lastActive: s.lastActive,
        location: s.location
      }))
    });
  }

  if (activeSessions.length >= maxDevices && force) {
    if (evictSessionId) {
      // Evict the user-selected session
      activeSessions = activeSessions.filter(s => s.sessionId !== evictSessionId);
    } else {
      // Fallback: Evict the oldest session (sort by loginTime ascending)
      activeSessions.sort((a, b) => new Date(a.loginTime) - new Date(b.loginTime));
      activeSessions.shift(); // remove oldest
    }
  }

  const sessionId = uuidv4();

  activeSessions.push({
    sessionId,
    deviceId,
    deviceName,
    browser,
    os,
    ip,
    location: '',
    loginTime: new Date(),
    lastActive: new Date()
  });

  user.sessions = activeSessions;
  await user.save();

  const token = jwt.sign(
    { userId: user._id, email: user.email, sessionId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    deviceId,
    sessionId,
    user: buildUserResponse(user)
  });
}

// ─── Send Registration OTP ───────────────────────────────────────────────────
router.post('/send-register-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PendingRegistration.findOneAndUpdate(
      { email: email.toLowerCase() },
      { name, password: hashedPassword, otp, expiresAt },
      { upsert: true, new: true }
    );

    const result = await sendRegistrationOtpEmail(email, otp);
    res.json({
      success: true,
      message: result.simulated
        ? 'Verification code generated (Check backend server console).'
        : 'Verification code sent to your email.'
    });
  } catch (err) {
    console.error('Send register OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Verify Registration OTP & Register ────────────────────────────────────────
router.post('/verify-register-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const pending = await PendingRegistration.findOne({ email: email.toLowerCase() });
    if (!pending) {
      return res.status(400).json({ error: 'No registration request found or it has expired.' });
    }

    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Double check that user wasn't registered in the meantime
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await PendingRegistration.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ error: 'User already exists.' });
    }

    const newUser = new User({
      name: pending.name,
      email: pending.email,
      password: pending.password
    });
    await newUser.save();

    // Clean up
    await PendingRegistration.deleteOne({ email: email.toLowerCase() });

    // Automatically create session and login user
    return createSession(newUser, req, res, false);
  } catch (err) {
    console.error('Verify register OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Social Register with Password ────────────────────────────────────────────
router.post('/social-register', async (req, res) => {
  try {
    const { name, email, password, avatarUrl, provider, providerId } = req.body;
    if (!name || !email || !password || !provider || !providerId) {
      return res.status(400).json({ error: 'Please enter all fields.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in and link accounts in settings.' });
    }

    // Check if another account has this providerId
    const query = {};
    if (provider === 'google') query.googleId = providerId;
    else if (provider === 'github') query.githubId = providerId;
    else if (provider === 'microsoft') query.microsoftId = providerId;
    else return res.status(400).json({ error: 'Invalid provider.' });

    const linkedUser = await User.findOne(query);
    if (linkedUser) {
      return res.status(400).json({ error: 'This social account is already linked to another user.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatarUrl: avatarUrl || null
    });

    if (provider === 'google') newUser.googleId = providerId;
    else if (provider === 'github') newUser.githubId = providerId;
    else if (provider === 'microsoft') newUser.microsoftId = providerId;

    await newUser.save();

    return createSession(newUser, req, res, false);
  } catch (err) {
    console.error('Social register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Connect Google Account ───────────────────────────────────────────────────
router.post('/connect-google', authMiddleware, async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Google Access token is required.' });
    }

    const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const { sub: googleId, picture } = response.data;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const linkedUser = await User.findOne({ googleId });
    if (linkedUser && linkedUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ error: 'This Google account is already linked to another user.' });
    }

    user.googleId = googleId;
    if (!user.avatarUrl && picture) user.avatarUrl = picture;
    await user.save();

    res.json({ success: true, message: 'Google account connected successfully.', user: buildUserResponse(user) });
  } catch (err) {
    console.error('Connect Google error:', err);
    res.status(400).json({ error: 'Failed to connect Google account.' });
  }
});

// ─── Disconnect OAuth Provider ────────────────────────────────────────────────
router.post('/disconnect-oauth', authMiddleware, async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required.' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Must have a local password OR at least one other connection, otherwise they can never log back in!
    if (!user.password) {
      // check other connection counts
      let connectionCount = 0;
      if (user.googleId) connectionCount++;
      if (user.githubId) connectionCount++;
      if (user.microsoftId) connectionCount++;

      if (connectionCount <= 1) {
        return res.status(400).json({ error: 'Cannot disconnect the only sign-in method. Please set a local password in settings first.' });
      }
    }

    if (provider === 'google') user.googleId = null;
    else if (provider === 'github') user.githubId = null;
    else if (provider === 'microsoft') user.microsoftId = null;
    else return res.status(400).json({ error: 'Invalid provider.' });

    await user.save();

    res.json({ success: true, message: `${provider} account disconnected successfully.`, user: buildUserResponse(user) });
  } catch (err) {
    console.error('Disconnect provider error:', err);
    res.status(500).json({ error: 'Internal server error disconnecting provider.' });
  }
});

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return createSession(newUser, req, res, false);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, force } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields.' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    return createSession(user, req, res, !!force, req.body.evictSessionId);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Google Sign-In (credential / ID token) ───────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential, force } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Google token verification failed, falling back to decode:', verifyErr.message);
      const parts = credential.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      } else {
        throw new Error('Invalid JWT format');
      }
    }

    const { email, name, sub: googleId, picture } = payload;

    let user = await User.findOne({ email });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      }
    } else {
      return res.json({ requiresPassword: true, email, name, avatarUrl: picture || null, googleId });
    }

    return createSession(user, req, res, !!force, req.body.evictSessionId);
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(400).json({ error: 'Google authentication failed.' });
  }
});

// ─── Google Access Token ──────────────────────────────────────────────────────
router.post('/google-token', async (req, res) => {
  try {
    const { accessToken, force } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required.' });
    }

    const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const { email, name, sub: googleId, picture } = response.data;

    let user = await User.findOne({ email });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      }
    } else {
      return res.json({ requiresPassword: true, email, name, avatarUrl: picture || null, googleId });
    }

    return createSession(user, req, res, !!force, req.body.evictSessionId);
  } catch (err) {
    console.error('Google Access Token verification failed:', err.message);
    res.status(400).json({ error: 'Google authentication failed.' });
  }
});

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
router.post('/github', async (req, res) => {
  try {
    const { code, force } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'GitHub authorization code is required.' });
    }

    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(400).json({ error: 'Failed to obtain access token from GitHub.' });
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const { id: githubId, name, avatar_url, email: githubEmail } = userResponse.data;

    let email = githubEmail;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${accessToken}` }
      });
      const primary = emailResponse.data.find(e => e.primary && e.verified);
      email = primary ? primary.email : emailResponse.data[0]?.email;
    }
    if (!email) email = `github_${githubId}@selfranker.com`;

    let user = await User.findOne({ email });
    if (user) {
      if (!user.githubId) {
        user.githubId = String(githubId);
        if (!user.avatarUrl && avatar_url) user.avatarUrl = avatar_url;
        await user.save();
      }
    } else {
      user = new User({ name: name || email.split('@')[0], email, githubId: String(githubId), avatarUrl: avatar_url || null });
      await user.save();
    }

    return createSession(user, req, res, !!force, req.body.evictSessionId);
  } catch (err) {
    console.error('GitHub Auth error:', err);
    res.status(400).json({ error: 'GitHub authentication failed.' });
  }
});

// ─── Logout (invalidate current session) ─────────────────────────────────────
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.user;
    if (!sessionId) {
      return res.json({ success: true, message: 'Logged out.' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (user) {
      user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
      await user.save();
    }

    res.json({ success: true, message: 'Session invalidated successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to logout.' });
  }
});

// ─── Get Active Sessions ──────────────────────────────────────────────────────
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('sessions isPremium');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const currentSessionId = req.user.sessionId;

    res.json({
      sessions: (user.sessions || []).map(s => ({
        sessionId: s.sessionId,
        deviceName: s.deviceName,
        browser: s.browser,
        os: s.os,
        ip: s.ip,
        location: s.location,
        loginTime: s.loginTime,
        lastActive: s.lastActive,
        isCurrent: s.sessionId === currentSessionId
      })),
      isPremium: user.isPremium,
      maxDevices: MAX_DEVICES[user.isPremium ? 'premium' : 'free']
    });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Failed to load sessions.' });
  }
});

// ─── Remote logout (sign out a specific session) ──────────────────────────────
router.delete('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const targetId = req.params.sessionId;
    user.sessions = user.sessions.filter(s => s.sessionId !== targetId);
    await user.save();

    res.json({ success: true, message: 'Device signed out successfully.' });
  } catch (err) {
    console.error('Remote logout error:', err);
    res.status(500).json({ error: 'Failed to sign out device.' });
  }
});

// ─── Fetch Profile ────────────────────────────────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Seed default onboarding notifications if empty
    if (!user.notifications || user.notifications.length === 0) {
      user.notifications = [
        {
          title: 'Weekly Progress Digest',
          message: 'Welcome to Self Ranker! Update your Notification Preferences in settings to control what alerts you receive.',
          type: 'weeklyDigest',
          read: false
        },
        {
          title: 'Quiz Result Alerts',
          message: 'Practice makes perfect. Complete your daily AI Quiz questions to test your skills and rise up the global cohort leaderboard.',
          type: 'quizResults',
          read: false
        },
        {
          title: 'Rank Change Alerts',
          message: 'Earn XP by generating learning paths, taking quizzes, and completing study sessions to increase your Level!',
          type: 'rankUpdates',
          read: false
        }
      ];
      await user.save();
    }

    res.json({ user: buildUserResponse(user) });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// ─── Delete Account ────────────────────────────────────────────────────────────
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.userId;

    await Promise.all([
      User.deleteOne({ _id: userId }),
      Analytics.deleteOne({ userEmail }),
      LearningPath.deleteMany({ userEmail })
    ]);

    res.json({ success: true, message: 'Account and all associated data permanently deleted.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
});

// ─── Add XP ──────────────────────────────────────────────────────────────────
router.post('/add-xp', authMiddleware, async (req, res) => {
  try {
    const { xpToAdd } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.xp += parseInt(xpToAdd || 0);
    const LEVELS = [
      { level: 1, minXp: 0, maxXp: 500 },
      { level: 2, minXp: 500, maxXp: 1500 },
      { level: 3, minXp: 1500, maxXp: 3000 },
      { level: 4, minXp: 3000, maxXp: 5000 },
      { level: 5, minXp: 5000, maxXp: Infinity },
    ];
    const levelObj = LEVELS.find(l => user.xp >= l.minXp && user.xp < l.maxXp) || LEVELS[LEVELS.length - 1];
    user.level = levelObj.level;
    await user.save();

    res.json({ user: buildUserResponse(user) });
  } catch (err) {
    console.error('Add XP error:', err);
    res.status(500).json({ error: 'Server error adding XP.' });
  }
});

// ─── Profile Update ───────────────────────────────────────────────────────────
router.post('/profile-update', authMiddleware, async (req, res) => {
  try {
    const { name, email, bio, examGoal } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (examGoal !== undefined) user.examGoal = examGoal;

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ error: 'Email address is already in use.' });
      }
      user.email = email;
    }

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, sessionId: req.user.sessionId || '' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: buildUserResponse(user) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// ─── Change Password ───────────────────────────────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.password) {
      let provider = 'Google';
      if (user.githubId) provider = 'GitHub';
      if (user.microsoftId) provider = 'Microsoft';
      return res.status(400).json({
        error: `This account is linked via ${provider} Sign-In. You cannot change password directly.`
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password has been updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error changing password.' });
  }
});

// ─── GitHub OAuth Callback ────────────────────────────────────────────────────
router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Authorization code is missing.');

    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) return res.status(400).send('Failed to obtain access token from GitHub.');

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const { id: githubId, name, avatar_url, email: githubEmail } = userResponse.data;

    let email = githubEmail;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${accessToken}` }
      });
      const primaryEmailObj = emailResponse.data.find(e => e.primary && e.verified);
      email = primaryEmailObj ? primaryEmailObj.email : emailResponse.data[0]?.email;
    }
    if (!email) email = `github_${githubId}@selfranker.com`;

    const frontendUrl = FRONTEND_URL;

    // ── Check if state is for connecting account ──
    if (state && state.startsWith('connect_')) {
      const token = state.split('connect_')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
          return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('User not found.')}`);
        }

        const linkedUser = await User.findOne({ githubId: String(githubId) });
        if (linkedUser && linkedUser._id.toString() !== user._id.toString()) {
          return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('This GitHub account is already linked to another user.')}`);
        }

        user.githubId = String(githubId);
        if (!user.avatarUrl && avatar_url) user.avatarUrl = avatar_url;
        await user.save();

        return res.redirect(`${frontendUrl}/#/dashboard/settings?success=${encodeURIComponent('GitHub account connected successfully!')}`);
      } catch (err) {
        console.error('GitHub connection error:', err);
        return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('Failed to connect GitHub account.')}`);
      }
    }

    let user = await User.findOne({ email });
    if (user) {
      if (!user.githubId) {
        user.githubId = String(githubId);
        if (!user.avatarUrl && avatar_url) user.avatarUrl = avatar_url;
        await user.save();
      }
    } else {
      // Redirect to signup with state so they can choose a password
      return res.redirect(`${frontendUrl}/#/signup?oauth_setup=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || email.split('@')[0])}&avatarUrl=${encodeURIComponent(avatar_url || '')}&provider=github&providerId=${encodeURIComponent(githubId)}`);
    }

    // For callback redirects, create session silently (force=true to bypass dialog)
    const { deviceId, deviceName, browser, os, ip } = parseDeviceInfo(req);
    const tier = user.isPremium ? 'premium' : 'free';
    const maxDevices = MAX_DEVICES[tier];
    if ((user.sessions || []).length >= maxDevices) {
      user.sessions.sort((a, b) => new Date(a.loginTime) - new Date(b.loginTime));
      user.sessions.shift();
    }
    const sessionId = uuidv4();
    user.sessions.push({ sessionId, deviceId, deviceName, browser, os, ip, location: '', loginTime: new Date(), lastActive: new Date() });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email, sessionId }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${frontendUrl}/#/signin?token=${token}`);
  } catch (err) {
    console.error('GitHub callback error:', err);
    res.status(500).send('GitHub authentication failed.');
  }
});

// ─── Google OAuth Redirect Callback ──────────────────────────────────────────
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Google authorization code is required.');

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code'
    });

    const { id_token } = tokenResponse.data;
    if (!id_token) return res.status(400).send('Failed to obtain ID token from Google.');

    const parts = id_token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const { email, name, sub: googleId, picture } = payload;

    const frontendUrl = FRONTEND_URL;

    // ── Check if state is for connecting account ──
    if (state && state.startsWith('connect_')) {
      const token = state.split('connect_')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
          return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('User not found.')}`);
        }

        const linkedUser = await User.findOne({ googleId });
        if (linkedUser && linkedUser._id.toString() !== user._id.toString()) {
          return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('This Google account is already linked to another user.')}`);
        }

        user.googleId = googleId;
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();

        return res.redirect(`${frontendUrl}/#/dashboard/settings?success=${encodeURIComponent('Google account connected successfully!')}`);
      } catch (err) {
        console.error('Google connection error:', err);
        return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('Failed to connect Google account.')}`);
      }
    }

    let user = await User.findOne({ email });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      }
    } else {
      // Redirect to signup with state so they can choose a password
      return res.redirect(`${frontendUrl}/#/signup?oauth_setup=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || email.split('@')[0])}&avatarUrl=${encodeURIComponent(picture || '')}&provider=google&providerId=${encodeURIComponent(googleId)}`);
    }

    const { deviceId, deviceName, browser, os, ip } = parseDeviceInfo(req);
    const tier = user.isPremium ? 'premium' : 'free';
    const maxDevices = MAX_DEVICES[tier];
    if ((user.sessions || []).length >= maxDevices) {
      user.sessions.sort((a, b) => new Date(a.loginTime) - new Date(b.loginTime));
      user.sessions.shift();
    }
    const sessionId = uuidv4();
    user.sessions.push({ sessionId, deviceId, deviceName, browser, os, ip, location: '', loginTime: new Date(), lastActive: new Date() });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email, sessionId }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${frontendUrl}/#/signin?token=${token}`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.status(500).send('Google authentication failed.');
  }
});

// ─── Microsoft OAuth Callback ──────────────────────────────────────────────────
router.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Authorization code is missing.');

    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: `${BACKEND_URL}/api/auth/microsoft/callback`,
        grant_type: 'authorization_code',
        scope: 'openid profile email User.Read'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) return res.status(400).send('Failed to obtain access token from Microsoft.');

    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const { id: microsoftId, displayName, mail, userPrincipalName } = userResponse.data;

    let email = mail || userPrincipalName;
    if (!email) email = `microsoft_${microsoftId}@selfranker.com`;

    const frontendUrl = FRONTEND_URL;

    // ── Check if state is for connecting account ──
    if (state && state.startsWith('connect_')) {
      const token = state.split('connect_')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
          return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('User not found.')}`);
        }

        const linkedUser = await User.findOne({ microsoftId: String(microsoftId) });
        if (linkedUser && linkedUser._id.toString() !== user._id.toString()) {
          return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('This Microsoft account is already linked to another user.')}`);
        }

        user.microsoftId = String(microsoftId);
        await user.save();

        return res.redirect(`${frontendUrl}/#/dashboard/settings?success=${encodeURIComponent('Microsoft account connected successfully!')}`);
      } catch (err) {
        console.error('Microsoft connection error:', err);
        return res.redirect(`${frontendUrl}/#/dashboard/settings?error=${encodeURIComponent('Failed to connect Microsoft account.')}`);
      }
    }

    let user = await User.findOne({ email });
    if (user) {
      if (!user.microsoftId) {
        user.microsoftId = String(microsoftId);
        await user.save();
      }
    } else {
      // Redirect to signup with state so they can choose a password
      return res.redirect(`${frontendUrl}/#/signup?oauth_setup=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(displayName || email.split('@')[0])}&avatarUrl=&provider=microsoft&providerId=${encodeURIComponent(microsoftId)}`);
    }

    // Create session silently (force=true logic)
    const { deviceId, deviceName, browser, os, ip } = parseDeviceInfo(req);
    const tier = user.isPremium ? 'premium' : 'free';
    const maxDevices = MAX_DEVICES[tier];
    if ((user.sessions || []).length >= maxDevices) {
      user.sessions.sort((a, b) => new Date(a.loginTime) - new Date(b.loginTime));
      user.sessions.shift();
    }
    const sessionId = uuidv4();
    user.sessions.push({ sessionId, deviceId, deviceName, browser, os, ip, location: '', loginTime: new Date(), lastActive: new Date() });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email, sessionId }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${frontendUrl}/#/signin?token=${token}`);
  } catch (err) {
    console.error('Microsoft callback error:', err);
    res.status(500).send('Microsoft authentication failed.');
  }
});

// Helper: Send Registration OTP Email
async function sendRegistrationOtpEmail(email, code) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@selfranker.com';

  if (!host || !user || !pass) {
    console.log('\n==================================================');
    console.log(`[DEVELOPMENT ONLY] Registration OTP for ${email}: ${code}`);
    console.log('==================================================\n');
    return { simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"Self Ranker" <${from}>`,
      to: email,
      subject: 'Registration Verification Code - Self Ranker',
      text: `Your registration verification code is: ${code}. This code is valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center;">Self Ranker</h2>
          <p>Hello,</p>
          <p>Thank you for signing up for Self Ranker. To complete your registration, please use the following 6-digit verification code:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background-color: #e0e7ff; padding: 12px 24px; border-radius: 8px; border: 1px solid #c7d2fe; display: inline-block;">${code}</span>
          </div>
          <p>This code is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2026 Self Ranker. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { simulated: false };
  } catch (mailErr) {
    console.error('Mail sending failed, falling back to console log:', mailErr);
    console.log('\n==================================================');
    console.log(`[FALLBACK LOG] Registration OTP for ${email}: ${code}`);
    console.log('==================================================\n');
    return { simulated: true };
  }
}

// Helper: Send Password Reset Verification Code Email
async function sendResetCodeEmail(email, code) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@selfranker.com';

  if (!host || !user || !pass) {
    console.log('\n==================================================');
    console.log(`[DEVELOPMENT ONLY] Verification code for ${email}: ${code}`);
    console.log('==================================================\n');
    return { simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"Self Ranker" <${from}>`,
      to: email,
      subject: 'Password Reset Verification Code - Self Ranker',
      text: `Your password reset verification code is: ${code}. This code is valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center;">Self Ranker</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Use the following 6-digit verification code to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background-color: #e0e7ff; padding: 12px 24px; border-radius: 8px; border: 1px solid #c7d2fe; display: inline-block;">${code}</span>
          </div>
          <p>This code is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2026 Self Ranker. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { simulated: false };
  } catch (mailErr) {
    console.error('Mail sending failed, falling back to console log:', mailErr);
    console.log('\n==================================================');
    console.log(`[FALLBACK LOG] Verification code for ${email}: ${code}`);
    console.log('==================================================\n');
    return { simulated: true };
  }
}

// ─── Forgot Password ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (!user.password) {
      let provider = 'Google';
      if (user.githubId) provider = 'GitHub';
      if (user.microsoftId) provider = 'Microsoft';
      return res.status(400).json({
        error: `This account is linked via ${provider} Sign-In. Please sign in using ${provider} instead.`
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const result = await sendResetCodeEmail(user.email, code);

    res.json({
      success: true,
      message: result.simulated
        ? 'Verification code generated (Check backend server console).'
        : 'Verification code sent to your email.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// ─── Reset Password ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ error: 'No active reset request found. Please request a new code.' });
    }

    if (user.resetCodeExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (user.resetCode !== code.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.resetCode = null;
    user.resetCodeExpires = null;
    user.sessions = [];
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'An error occurred while resetting your password.' });
  }
});

// ─── Update Notification Preferences ───────────────────────────────────────────
router.put('/notification-preferences', authMiddleware, async (req, res) => {
  const { streakReminders, quizResults, weeklyDigest, rankUpdates } = req.body;
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.notificationPreferences = {
      streakReminders: streakReminders !== undefined ? streakReminders : user.notificationPreferences.streakReminders,
      quizResults: quizResults !== undefined ? quizResults : user.notificationPreferences.quizResults,
      weeklyDigest: weeklyDigest !== undefined ? weeklyDigest : user.notificationPreferences.weeklyDigest,
      rankUpdates: rankUpdates !== undefined ? rankUpdates : user.notificationPreferences.rankUpdates
    };

    await user.save();
    res.json({ success: true, notificationPreferences: user.notificationPreferences });
  } catch (err) {
    console.error('Update notif prefs error:', err);
    res.status(500).json({ error: 'Failed to save notification preferences.' });
  }
});

// ─── Mark All Notifications As Read ─────────────────────────────────────────────
router.post('/notifications/read', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    (user.notifications || []).forEach(notif => {
      notif.read = true;
    });

    await user.save();
    res.json({ success: true, notifications: (user.notifications || []).slice(-20).reverse() });
  } catch (err) {
    console.error('Mark notifs read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

// ─── Mark Specific Notification As Read ─────────────────────────────────────────
router.post('/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  const { notificationId } = req.params;
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const notif = (user.notifications || []).find(n => n._id.toString() === notificationId);
    if (notif) {
      notif.read = true;
    }

    await user.save();
    res.json({ success: true, notifications: (user.notifications || []).slice(-20).reverse() });
  } catch (err) {
    console.error('Mark specific notif read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

export default router;
