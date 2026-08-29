import mongoose from 'mongoose';

const mockAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  sectionId: {
    type: String, // Matches the _id of the section in MockTest.examPattern.sections
    required: false,
  },
  selectedAnswer: {
    type: String,
    default: '',
  },
  isMarkedForReview: {
    type: Boolean,
    default: false,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  visited: {
    type: Boolean,
    default: false,
  },
  answerSavedAt: {
    type: Date,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  questionOrder: {
    type: Number,
    default: 0,
  }
}, { _id: false });

const mockSectionPerformanceSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true,
  },
  sectionName: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  correct: {
    type: Number,
    default: 0,
  },
  incorrect: {
    type: Number,
    default: 0,
  },
  skipped: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
  },
  accuracy: {
    type: Number,
    default: 0,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  }
}, { _id: false });

const mockTestAttemptSchema = new mongoose.Schema(
  {
    mockTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: function() {
        return this.attemptCategory === 'mock_test';
      },
    },
    attemptCategory: {
      type: String,
      enum: ['mock_test', 'pyq_paper'],
      default: 'mock_test',
      required: true,
    },
    pyqPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PYQPaper',
      default: null,
    },
    pyqYear: {
      type: Number,
      default: null,
    },
    pyqPaperName: {
      type: String,
      default: null,
    },
    sourceVerifiedAtAttempt: {
      type: Date,
      default: null,
    },
    questionSnapshot: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
      required: true,
    },
    status: {
      type: String,
      enum: ['created', 'started', 'submitted', 'expired', 'abandoned'],
      default: 'created',
      required: true,
    },
    questions: [mockAnswerSchema],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    currentSectionIndex: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    percentile: {
      type: Number,
      default: null,
    },
    rank: {
      type: Number,
      default: null,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    sectionPerformance: [mockSectionPerformanceSchema],
    subjectPerformance: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    topicPerformance: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    selectionSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    resultGenerated: {
      type: Boolean,
      default: false,
    },
    feedbackGenerated: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
mockTestAttemptSchema.index({ userId: 1, mockTestId: 1 });
mockTestAttemptSchema.index({ mockTestId: 1, status: 1 });
mockTestAttemptSchema.index({ userId: 1, startedAt: -1 });

const MockTestAttempt = mongoose.model('MockTestAttempt', mockTestAttemptSchema);
export default MockTestAttempt;
