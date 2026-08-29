import mongoose from 'mongoose';

const pyqPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
      default: null,
    },
    examName: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    paperName: {
      type: String,
      required: [true, 'Paper name is required'],
      trim: true,
    },
    paperCode: {
      type: String,
      trim: true,
    },
    paperType: {
      type: String,
      enum: ['prelims', 'mains', 'tier_1', 'tier_2', 'descriptive', 'interview'],
      required: [true, 'Paper type is required'],
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      required: [true, 'Language is required'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    negativeMarkingEnabled: {
      type: Boolean,
      default: false,
    },
    defaultNegativeMarks: {
      type: Number,
      default: 0,
    },
    officialSourceName: {
      type: String,
      required: [true, 'Official source name is required'],
      trim: true,
    },
    officialSourceUrl: {
      type: String,
      required: [true, 'Official source URL is required'],
      trim: true,
    },
    officialAnswerKeyUrl: {
      type: String,
      trim: true,
    },
    sourceVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    instructions: {
      type: String,
      trim: true,
    },
    instructionsHindi: {
      type: String,
      trim: true,
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
    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'published', 'archived'],
      default: 'draft',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Slug auto-generation pre-save hook
pyqPaperSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Publication validations
  if (this.status === 'published' || this.isPublished) {
    if (!this.sourceVerified) {
      return next(new Error('A PYQ paper cannot be published unless sourceVerified is true.'));
    }
  }

  next();
});

// Enforce unique combination: examId + phaseId + year + paperName + language
pyqPaperSchema.index(
  { examId: 1, phaseId: 1, year: 1, paperName: 1, language: 1 },
  { unique: true }
);

// compound and search indexes
pyqPaperSchema.index({ examId: 1, year: 1, status: 1 });
pyqPaperSchema.index({ examId: 1, phaseId: 1, paperType: 1 });
pyqPaperSchema.index({ isPublished: 1, status: 1 });

const PYQPaper = mongoose.model('PYQPaper', pyqPaperSchema);
export default PYQPaper;
