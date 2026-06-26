import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  quizScores: [
    {
      date: String,
      score: Number,
      subject: String
    }
  ],
  weeklyActivity: [
    {
      day: String,
      sessions: Number,
      questions: Number
    }
  ],
  subjectProgress: [
    {
      subject: String,
      progress: Number,
      color: String
    }
  ]
}, { timestamps: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
