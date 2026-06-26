import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    default: ''
  },
  totalDays: {
    type: Number,
    required: true
  },
  createdAt: {
    type: String,
    required: true
  },
  milestones: {
    type: Array,
    default: []
  },
  days: {
    type: Array,
    default: []
  },
  completedTasks: {
    type: Map,
    of: Boolean,
    default: {}
  },
  archived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const LearningPath = mongoose.model('LearningPath', learningPathSchema);
export default LearningPath;
