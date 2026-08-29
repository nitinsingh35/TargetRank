import mongoose from 'mongoose';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const previousYearPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Paper title is required'],
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
      required: [true, 'Phase ID is required'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      validate: {
        validator: function(val) {
          const currentYear = new Date().getFullYear();
          return val >= 1950 && val <= currentYear + 2;
        },
        message: 'Please provide a valid year (1950 to near future)',
      },
    },
    paperType: {
      type: String,
      enum: ['prelims', 'mains', 'tier_1', 'tier_2', 'objective', 'descriptive'],
      required: [true, 'Paper type is required'],
    },
    paperCode: {
      type: String,
      required: [true, 'Paper code is required'],
      trim: true,
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'english',
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be greater than 0'],
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    negativeMarkingEnabled: {
      type: Boolean,
      default: true,
    },
    defaultNegativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    instructions: {
      type: String,
      default: '',
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    sections: {
      type: [sectionSchema],
      default: [],
    },
    source: {
      type: String,
      enum: ['official', 'memory_based', 'practice_reconstructed'],
      default: 'official',
    },
    paperPdfUrl: {
      type: String,
      default: '',
    },
    answerKeyPdfUrl: {
      type: String,
      default: '',
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
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Prevent duplicate papers
previousYearPaperSchema.index(
  { examId: 1, year: 1, paperType: 1, paperCode: 1 },
  { unique: true }
);

// Slug auto-generation middleware
previousYearPaperSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    const randomHex = Math.floor(Math.random() * 0xffff).toString(16);
    this.slug = slugify(`${this.title}-${this.year}-${this.paperCode}-${randomHex}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

const PreviousYearPaper = mongoose.model('PreviousYearPaper', previousYearPaperSchema);
export default PreviousYearPaper;
