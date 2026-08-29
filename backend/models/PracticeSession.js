import mongoose from 'mongoose';

const practiceSessionSchema = new mongoose.Schema(
  {
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
    mode: {
      type: String,
      enum: ['smart_mixed', 'important_only', 'pyq_only', 'pyq_important_mixed', 'weak_topics', 'revision_mode', 'subject_wise', 'topic_wise', 'full_mock', 'custom_mock', 'revision'],
      required: true,
    },
    practiceMode: {
      type: String,
      enum: ['smart_practice', 'current_affairs', 'revision', 'weak_topics', 'smart_mixed', 'important_only', 'pyq_only', 'pyq_important_mixed', 'revision_mode', 'subject_wise', 'topic_wise', 'full_mock', 'custom_mock'],
      default: 'smart_practice',
    },
    currentAffairsPackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CurrentAffairsPack',
      default: null,
    },
    currentAffairsMonth: {
      type: Number,
      default: null,
    },
    currentAffairsYear: {
      type: Number,
      default: null,
    },
    currentAffairsCategories: {
      type: [String],
      default: [],
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    requestedQuestionCount: {
      type: Number,
      required: true,
    },
    generatedQuestionCount: {
      type: Number,
      required: true,
    },
    subjectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      }
    ],
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      }
    ],
    difficultyPreference: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'english',
    },
    sourceFilter: {
      type: String,
      enum: ['all', 'pyq_only', 'pyq_important', 'most_important', 'high_weightage', 'book_based', 'current_affairs', 'mentor_recommended'],
      default: 'all',
    },
    questionSelectionRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
    answers: {
      type: Map,
      of: String,
      default: {}, // Maps questionId string to selectedOption string
    },
    markedForReview: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
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
        answerSavedAt: {
          type: Date,
        },
        timeSpentSeconds: {
          type: Number,
          default: 0,
        },
        visited: {
          type: Boolean,
          default: false,
        },
      }
    ],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
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
    status: {
      type: String,
      enum: ['created', 'started', 'submitted', 'expired', 'abandoned'],
      default: 'created',
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
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    subjectPerformance: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        subjectName: {
          type: String,
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
      }
    ],
    topicPerformance: [
      {
        topicId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Topic',
        },
        topicName: {
          type: String,
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
      }
    ],
    resultGenerated: {
      type: Boolean,
      default: false,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    weakTopicsDetected: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      }
    ],
    selectionSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

practiceSessionSchema.index({ userId: 1, status: 1, startedAt: -1 });
practiceSessionSchema.index({ userId: 1, status: 1 });
practiceSessionSchema.index({ userId: 1, startedAt: -1 });
practiceSessionSchema.index({ questionIds: 1 });

const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
export default PracticeSession;
