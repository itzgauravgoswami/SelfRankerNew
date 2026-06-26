import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  deviceId: { type: String, default: '' },
  deviceName: { type: String, default: 'Unknown Device' },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  ip: { type: String, default: '' },
  location: { type: String, default: '' },
  loginTime: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function() { return !this.googleId && !this.githubId && !this.microsoftId; }
  },
  googleId: { type: String, default: null },
  githubId: { type: String, default: null },
  microsoftId: { type: String, default: null },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  avatarUrl: { type: String, default: null },
  bio: { type: String, default: '' },
  examGoal: { type: String, default: '' },
  isPremium: { type: Boolean, default: false },

  // Subscription metadata
  subscription: {
    type: { type: String, enum: ['free', 'premium'], default: 'free' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    expiresAt: { type: Date, default: null }
  },

  // Usage counters
  usage: {
    // Monthly (notes download)
    notesDownloadCount: { type: Number, default: 0 },
    notesResetDate: { type: Date, default: null },

    // Daily (quiz, Q&A, supreme)
    quizCountToday: { type: Number, default: 0 },
    quizResetDate: { type: Date, default: null },

    qaCountToday: { type: Number, default: 0 },
    qaResetDate: { type: Date, default: null },

    supremeCountToday: { type: Number, default: 0 },
    supremeResetDate: { type: Date, default: null }
  },

  // Active device sessions
  sessions: { type: [sessionSchema], default: [] },

  // Password Reset Verification
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },

  // Notification Preferences
  notificationPreferences: {
    streakReminders: { type: Boolean, default: true },
    quizResults: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
    rankUpdates: { type: Boolean, default: true }
  },

  // In-App Notifications
  notifications: [{
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true }, // e.g. streakReminders, quizResults, weeklyDigest, rankUpdates
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
