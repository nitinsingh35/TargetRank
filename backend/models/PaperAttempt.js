import mongoose from 'mongoose';

const answerAttemptSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedAnswer: {
      type: String,
      default: null,
    },
    isMarkedForReview: {
      type: Boolean,
      default: false,
    },
    visited: {
      type: Boolean,
      default: false,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const sectionPerformanceSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    correct: {
      type: Number,
      required: true,
      default: 0,
    },
    incorrect: {
      type: Number,
      required: true,
      default: 0,
    },
    skipped: {
      type: Number,
      required: true,
      default: 0,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    accuracy: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const paperAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PreviousYearPaper',
      required: true,
    },
    status: {
      type: String,
      enum: ['created', 'started', 'submitted', 'expired', 'abandoned'],
      default: 'created',
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    attemptCategory: {
      type: String,
      enum: ['previous_year_paper', 'mock_test', 'practice_session'],
      default: 'previous_year_paper',
      required: true,
    },
    questionSnapshot: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    answers: {
      type: [answerAttemptSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    percentilePlaceholder: {
      type: Number,
      default: null,
    },
    rankPlaceholder: {
      type: Number,
      default: null,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    sectionPerformance: {
      type: [sectionPerformanceSchema],
      default: [],
    },
    subjectPerformance: {
      type: Array,
      default: [],
    },
    topicPerformance: {
      type: Array,
      default: [],
    },
    resultGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Enforce unique constraints dynamically so that one user can only have
// ONE active attempt ('created' or 'started') at a time per previous year paper.
paperAttemptSchema.index(
  { userId: 1, paperId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['created', 'started'] } },
  }
);

// Quick lookup index for listing all attempts of a user
paperAttemptSchema.index({ userId: 1, paperId: 1 });

const PaperAttempt = mongoose.model('PaperAttempt', paperAttemptSchema);
export default PaperAttempt;
