import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import authMiddleware from '../authMiddleware.js';
import User from '../models/User.js';
import LearningPath from '../models/LearningPath.js';
import Analytics from '../models/Analytics.js';

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// 1. Get Analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    let analytics = await Analytics.findOne({ userEmail: req.user.email });
    
    // Auto-detect and reset old cached mock records
    if (analytics) {
      const totalSessions = analytics.weeklyActivity.reduce((sum, item) => sum + item.sessions, 0);
      const totalQuestions = analytics.weeklyActivity.reduce((sum, item) => sum + item.questions, 0);
      if (totalSessions === 23 && totalQuestions === 337) {
        console.log(`Purging old mock analytics for ${req.user.email}`);
        await Analytics.deleteOne({ _id: analytics._id });
        analytics = null;
      }
    }

    if (!analytics) {
      // Create empty default analytics log for new users
      analytics = new Analytics({
        userEmail: req.user.email,
        quizScores: [],
        weeklyActivity: [
          { day: 'Mon', sessions: 0, questions: 0 },
          { day: 'Tue', sessions: 0, questions: 0 },
          { day: 'Wed', sessions: 0, questions: 0 },
          { day: 'Thu', sessions: 0, questions: 0 },
          { day: 'Fri', sessions: 0, questions: 0 },
          { day: 'Sat', sessions: 0, questions: 0 },
          { day: 'Sun', sessions: 0, questions: 0 }
        ],
        subjectProgress: [
          { subject: 'Mathematics', progress: 0, color: 'bg-purple-500' },
          { subject: 'Physics', progress: 0, color: 'bg-indigo-500' },
          { subject: 'Chemistry', progress: 0, color: 'bg-green-500' },
          { subject: 'Biology', progress: 0, color: 'bg-pink-500' },
          { subject: 'History', progress: 0, color: 'bg-amber-500' }
        ]
      });
    }

    // Merge/normalize existing subjectProgress entries to clean up duplicates (e.g. Maths -> Mathematics)
    if (analytics && analytics.subjectProgress) {
      const mergedMap = new Map();
      const normalizationRules = {
        'maths': 'Mathematics',
        'math': 'Mathematics',
        'mathematics': 'Mathematics',
        'physics': 'Physics',
        'chemistry': 'Chemistry',
        'biology': 'Biology',
        'bio': 'Biology',
        'history': 'History'
      };

      let hasDuplicates = false;

      for (const item of analytics.subjectProgress) {
        if (!item.subject) continue;
        const lower = item.subject.trim().toLowerCase();
        const normSubject = normalizationRules[lower] || (item.subject.trim().charAt(0).toUpperCase() + item.subject.trim().slice(1));
        
        if (mergedMap.has(normSubject)) {
          const existing = mergedMap.get(normSubject);
          existing.progress = Math.min(100, existing.progress + item.progress);
          hasDuplicates = true;
        } else {
          mergedMap.set(normSubject, {
            subject: normSubject,
            progress: item.progress,
            color: item.color || 'bg-purple-500'
          });
        }
      }

      if (hasDuplicates || analytics.subjectProgress.length !== mergedMap.size) {
        analytics.subjectProgress = Array.from(mergedMap.values());
        analytics.markModified('subjectProgress');
        await analytics.save();
      }
    }

    res.json(analytics);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error loading analytics.' });
  }
});

// 1.5. Log User Activity / Action
router.post('/log-action', authMiddleware, async (req, res) => {
  try {
    let { actionType, subject, questionsCount, score } = req.body;

    if (subject) {
      const lower = subject.trim().toLowerCase();
      const normalizationRules = {
        'maths': 'Mathematics',
        'math': 'Mathematics',
        'mathematics': 'Mathematics',
        'physics': 'Physics',
        'chemistry': 'Chemistry',
        'biology': 'Biology',
        'bio': 'Biology',
        'history': 'History'
      };
      subject = normalizationRules[lower] || (subject.trim().charAt(0).toUpperCase() + subject.trim().slice(1));
    }

    let analytics = await Analytics.findOne({ userEmail: req.user.email });
    if (!analytics) {
      analytics = new Analytics({
        userEmail: req.user.email,
        quizScores: [],
        weeklyActivity: [
          { day: 'Mon', sessions: 0, questions: 0 },
          { day: 'Tue', sessions: 0, questions: 0 },
          { day: 'Wed', sessions: 0, questions: 0 },
          { day: 'Thu', sessions: 0, questions: 0 },
          { day: 'Fri', sessions: 0, questions: 0 },
          { day: 'Sat', sessions: 0, questions: 0 },
          { day: 'Sun', sessions: 0, questions: 0 }
        ],
        subjectProgress: [
          { subject: 'Mathematics', progress: 0, color: 'bg-purple-500' },
          { subject: 'Physics', progress: 0, color: 'bg-indigo-500' },
          { subject: 'Chemistry', progress: 0, color: 'bg-green-500' },
          { subject: 'Biology', progress: 0, color: 'bg-pink-500' },
          { subject: 'History', progress: 0, color: 'bg-amber-500' }
        ]
      });
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[new Date().getDay()];

    let dayAct = analytics.weeklyActivity.find(d => d.day === currentDay);
    if (!dayAct) {
      dayAct = { day: currentDay, sessions: 0, questions: 0 };
      analytics.weeklyActivity.push(dayAct);
    }

    if (actionType === 'study_session') {
      dayAct.sessions += 1;
    } else if (actionType === 'quiz' || actionType === 'qa') {
      dayAct.sessions += 1;
      dayAct.questions += questionsCount || 0;

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      analytics.quizScores.push({
        date: dateStr,
        score: score || 0,
        subject: subject || 'General'
      });

      if (analytics.quizScores.length > 10) {
        analytics.quizScores.shift();
      }
    }

    if (subject) {
      let subProg = analytics.subjectProgress.find(s => s.subject.toLowerCase() === subject.toLowerCase());
      const points = (actionType === 'quiz' || actionType === 'qa') ? Math.round((score || 0) * 0.15) : 5;

      if (!subProg) {
        const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-green-500', 'bg-pink-500', 'bg-amber-500'];
        const randomColor = colors[analytics.subjectProgress.length % colors.length];
        analytics.subjectProgress.push({
          subject,
          progress: Math.min(100, points),
          color: randomColor
        });
      } else {
        subProg.progress = Math.min(100, subProg.progress + points);
      }
      analytics.markModified('subjectProgress');
    }

    await analytics.save();

    // Add XP to user
    const user = await User.findOne({ email: req.user.email });
    if (user) {
      const xpReward = (actionType === 'quiz' || actionType === 'qa') ? (score || 0) * 10 : 25;
      user.xp += xpReward;

      const LEVELS = [
        { level: 1, minXp: 0, maxXp: 500 },
        { level: 2, minXp: 500, maxXp: 1500 },
        { level: 3, minXp: 1500, maxXp: 3000 },
        { level: 4, minXp: 3000, maxXp: 5000 },
        { level: 5, minXp: 5000, maxXp: Infinity },
      ];
      const levelObj = LEVELS.find(l => user.xp >= l.minXp && user.xp < l.maxXp) || LEVELS[LEVELS.length - 1];
      const oldLevel = user.level || 1;
      user.level = levelObj.level;

      // Handle Notifications
      if (!user.notifications) user.notifications = [];
      const prefs = user.notificationPreferences || {
        streakReminders: true,
        quizResults: true,
        weeklyDigest: false,
        rankUpdates: true
      };

      // 1. Quiz Results Alert
      if (actionType === 'quiz' && prefs.quizResults) {
        user.notifications.push({
          title: 'Quiz Result Alerts',
          message: `Your AI quiz results are ready! You scored ${score}% on subject "${subject || 'AI Quiz'}".`,
          type: 'quizResults'
        });
      }

      // 2. Rank / Level Change / XP Alerts
      if (prefs.rankUpdates) {
        if (user.level > oldLevel) {
          user.notifications.push({
            title: 'Rank Change Alerts',
            message: `Congratulations! You leveled up to Level ${user.level}!`,
            type: 'rankUpdates'
          });
        } else {
          user.notifications.push({
            title: 'Rank Change Alerts',
            message: `You earned +${xpReward} XP for completing a ${actionType}. Keep rising!`,
            type: 'rankUpdates'
          });
        }
      }

      // 3. Streak Nudge Alert
      if (prefs.streakReminders) {
        user.notifications.push({
          title: 'Streak Reminders',
          message: `Daily nudge: Keep your streak alive! Good job on studying today.`,
          type: 'streakReminders'
        });
      }

      await user.save();
    }

    res.json({ success: true, analytics });
  } catch (err) {
    console.error('Log activity error:', err);
    res.status(500).json({ error: 'Server error logging activity.' });
  }
});

// 2. Get Leaderboard
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    // Get all users sorted by XP descending
    const dbUsers = await User.find({}).sort({ xp: -1 }).limit(20);
    
    const leaderboardList = dbUsers.map((u, idx) => ({
      name: u.name,
      xp: u.xp,
      level: u.level,
      avatarUrl: u.avatarUrl,
      isUser: u.email === req.user.email,
      rank: idx + 1
    }));

    res.json(leaderboardList);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error loading leaderboard.' });
  }
});

// 3. Get Learning Paths
router.get('/learning-paths', authMiddleware, async (req, res) => {
  try {
    const paths = await LearningPath.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(paths);
  } catch (err) {
    console.error('Fetch paths error:', err);
    res.status(500).json({ error: 'Server error loading learning paths.' });
  }
});

// 4. Update Learning Path (Task checkoff or archive status)
router.post('/learning-paths/:id/update', authMiddleware, async (req, res) => {
  try {
    const path = await LearningPath.findOne({ id: req.params.id, userEmail: req.user.email });
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found.' });
    }

    // Apply updates (completedTasks, archived, etc.)
    if (req.body.completedTasks) {
      path.completedTasks = req.body.completedTasks;
      path.markModified('completedTasks');
    }
    if (req.body.archived !== undefined) {
      path.archived = req.body.archived;
    }

    await path.save();
    res.json(path);
  } catch (err) {
    console.error('Update path error:', err);
    res.status(500).json({ error: 'Server error updating learning path.' });
  }
});

// 5. Delete Learning Path
router.delete('/learning-paths/:id', authMiddleware, async (req, res) => {
  try {
    const result = await LearningPath.deleteOne({ id: req.params.id, userEmail: req.user.email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Learning path not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete path error:', err);
    res.status(500).json({ error: 'Server error deleting learning path.' });
  }
});

// 6. Cloudinary Avatar Upload
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file.' });
    }

    // Upload to Cloudinary using upload_stream helper
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'selfranker_avatars',
        transformation: [{ width: 250, height: 250, crop: 'thumb', gravity: 'face' }]
      },
      async (cloudinaryError, result) => {
        if (cloudinaryError || !result) {
          console.error('Cloudinary Upload Stream Error:', cloudinaryError);
          return res.status(500).json({ error: 'Failed to upload photo to image server.' });
        }

        // Save URL to User profile in DB
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
          return res.status(404).json({ error: 'User not found.' });
        }

        user.avatarUrl = result.secure_url;
        await user.save();

        res.json({
          avatarUrl: user.avatarUrl,
          message: 'Avatar uploaded and updated successfully!'
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Server error uploading profile photo.' });
  }
});

export default router;
