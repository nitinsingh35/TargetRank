import mongoose from 'mongoose';

const revisionHistoryEntrySchema = new mongoose.Schema(
  {
    revisedAt: {
      type: Date,
      default: Date.now,
    },
    action: {
      type: String,
      enum: ['revised', 'mastered', 'skipped', 'incorrect_again'],
      required: true,
    },
    selectedAnswer: {
      type: String,
      default: '',
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    nextRevisionDate: {
      type: Date,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false } // No separate _id for sub-documents
);

const revisionItemSchema = new mongoose.Schema(
  {
    // ── Core References (Phase 6 — preserved) ────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question ID is required'],
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
      required: [true, 'Phase ID is required'],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic ID is required'],
    },

    // ── Source & Classification (Phase 6 — preserved) ────────────────────────
    sourceType: {
      type: String,
      enum: ['wrong_answer', 'bookmarked', 'manual', 'mock_test', 'current_affairs'],
      default: 'wrong_answer',
    },

    // ── Scheduling (Phase 6 — preserved) ────────────────────────────────────
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'revised', 'mastered'],
      default: 'pending',
    },
    nextRevisionDate: {
      type: Date,
      default: Date.now,
    },
    revisionCount: {
      type: Number,
      default: 0,
    },
    lastRevisedAt: {
      type: Date,
    },

    // ── Legacy notes field (Phase 6 — preserved as-is) ───────────────────────
    notes: {
      type: String,
      trim: true,
    },

    // ── Phase 7 additions ────────────────────────────────────────────────────

    // Short inline note (separate from `notes` for per-item quick annotation)
    note: {
      type: String,
      default: '',
      trim: true,
    },

    // Status of the last time user answered this question in revision
    lastAnswerStatus: {
      type: String,
      enum: ['correct', 'incorrect', 'skipped', 'unknown'],
      default: 'unknown',
    },

    // When the user last practiced this question (any mode)
    lastPracticedAt: {
      type: Date,
    },

    // Which session last touched this item (for traceability)
    lastPracticeSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeSession',
    },

    // Whether the user has starred/bookmarked this revision item
    isBookmarked: {
      type: Boolean,
      default: false,
    },

    // Perceived difficulty of this question for the user
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },

    // User's self-assessed confidence for this topic/question
    confidenceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },

    // Full audit trail of every revision attempt
    revisionHistory: {
      type: [revisionHistoryEntrySchema],
      default: [],
    },

    // 0–100 mastery score; increases on revised/mastered, decreases on incorrect/skipped
    masteryScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Soft-delete: archived items are hidden from the daily deck but kept for analytics
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Primary lookup: today's pending items for a user
revisionItemSchema.index({ userId: 1, nextRevisionDate: 1, status: 1 });

// Unique constraint: one revision item per (user, question) pair
revisionItemSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// Additional Phase 7 lookup indexes
revisionItemSchema.index({ userId: 1, isArchived: 1, masteryScore: 1 });
revisionItemSchema.index({ userId: 1, subjectId: 1, status: 1 });
revisionItemSchema.index({ userId: 1, topicId: 1, status: 1 });

const RevisionItem = mongoose.model('RevisionItem', revisionItemSchema);
export default RevisionItem;
