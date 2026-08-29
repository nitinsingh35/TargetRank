import mongoose from 'mongoose';

const tutorialProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tutorialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutorial',
      required: true,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    watchedSeconds: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastOpenedAt: {
      type: Date,
      default: Date.now,
    },
    personalNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique user-tutorial progression pair
tutorialProgressSchema.index({ userId: 1, tutorialId: 1 }, { unique: true });

const TutorialProgress = mongoose.model('TutorialProgress', tutorialProgressSchema);
export default TutorialProgress;
