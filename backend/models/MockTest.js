import mongoose from 'mongoose';

const mockTestSectionSchema = new mongoose.Schema({
  name: {
    type: String,
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
  questionCount: {
    type: Number,
    required: true,
    default: 10,
  },
  marksPerQuestion: {
    type: Number,
    required: true,
    default: 2,
  },
  negativeMarks: {
    type: Number,
    required: true,
    default: 0.66,
  },
  durationMinutes: {
    type: Number,
    default: 0, // 0 means no section-specific time limit (uses overall test timer)
  },
  order: {
    type: Number,
    default: 0,
  }
}, { _id: true });

const mockTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
      required: [true, 'Exam Phase ID is required'],
    },
    category: {
      type: String,
      enum: ['full_length', 'sectional', 'subject_wise', 'topic_wise', 'pyq_paper', 'current_affairs', 'custom'],
      required: true,
      default: 'full_length',
    },
    instructions: {
      type: String,
    },
    instructionsHindi: {
      type: String,
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'english',
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    negativeMarkingEnabled: {
      type: Boolean,
      default: true,
    },
    defaultNegativeMarks: {
      type: Number,
      default: 0.33,
    },
    passingMarks: {
      type: Number,
      default: 40,
    },
    attemptLimit: {
      type: Number,
      default: 1,
    },
    availableFrom: {
      type: Date,
    },
    availableUntil: {
      type: Date,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questionSelectionMode: {
      type: String,
      enum: ['fixed', 'dynamic'],
      default: 'dynamic',
    },
    fixedQuestionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
    selectionRules: {
      subjectDistribution: {
        type: Map,
        of: Number,
        default: {},
      },
      topicDistribution: {
        type: Map,
        of: Number,
        default: {},
      },
      difficultyDistribution: {
        type: Map,
        of: Number,
        default: { easy: 25, medium: 50, hard: 25 },
      },
      sourceDistribution: {
        type: Map,
        of: Number,
        default: {},
      },
      includePYQ: {
        type: Boolean,
        default: true,
      },
      includeOriginalPractice: {
        type: Boolean,
        default: true,
      },
      includeCurrentAffairs: {
        type: Boolean,
        default: true,
      },
      excludeRecentAttemptedDays: {
        type: Number,
        default: 30,
      }
    },
    blueprint: {
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
      phaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamPhase' },
      subjectDistribution: { type: Map, of: Number },
      topicDistribution: { type: Map, of: Number },
      sourceDistribution: { type: Map, of: Number },
      difficultyDistribution: { type: Map, of: Number },
      totalQuestions: { type: Number },
      durationMinutes: { type: Number },
      totalMarks: { type: Number },
      negativeMarkingRule: { type: Number }
    },
    examPattern: {
      sections: [mockTestSectionSchema],
      allowSectionNavigation: {
        type: Boolean,
        default: true,
      },
      allowQuestionNavigation: {
        type: Boolean,
        default: true,
      },
      showQuestionPalette: {
        type: Boolean,
        default: true,
      },
      autoSubmit: {
        type: Boolean,
        default: true,
      }
    },
    tags: [
      {
        type: String,
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
mockTestSchema.index({ examId: 1, phaseId: 1, status: 1, isPublished: 1 });

const MockTest = mongoose.model('MockTest', mockTestSchema);
export default MockTest;
