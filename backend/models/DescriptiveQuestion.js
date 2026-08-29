import mongoose from 'mongoose';

const answerFrameworkSchema = new mongoose.Schema(
  {
    introductionHints: { type: String, default: '' },
    bodyHints:         { type: String, default: '' },
    conclusionHints:   { type: String, default: '' },
    keywords:          { type: [String], default: [] },
    examples:          { type: [String], default: [] },
  },
  { _id: false }
);

const descriptiveQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text in English is required'],
      trim: true,
    },
    questionHindi: {
      type: String,
      trim: true,
      default: '',
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
    year: {
      type: Number,
      required: false,
    },
    sourceType: {
      type: String,
      enum: ['previous_year', 'practice', 'current_affairs', 'mentor_created'],
      default: 'practice',
    },
    paperName: {
      type: String,
      trim: true,
      default: '',
    },
    questionNumber: {
      type: Number,
      default: null,
    },
    marks: {
      type: Number,
      required: [true, 'Marks is required'],
      min: [1, 'Marks must be greater than 0'],
    },
    suggestedWordLimit: {
      type: Number,
      required: [true, 'Suggested word limit is required'],
      min: [1, 'Suggested word limit must be greater than 0'],
    },
    suggestedTimeMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    answerFramework: {
      type: answerFrameworkSchema,
      default: () => ({}),
    },
    modelAnswer: {
      type: String,
      trim: true,
      default: '',
    },
    modelAnswerHindi: {
      type: String,
      trim: true,
      default: '',
    },
    referenceLinks: {
      type: [String],
      default: [],
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
// Prevent duplicate descriptive questions
descriptiveQuestionSchema.index(
  { examId: 1, year: 1, paperName: 1, questionNumber: 1 },
  {
    unique: true,
    // Allow partial indexing so that papers/numbers that are null/empty do not conflict
    partialFilterExpression: {
      year: { $gt: 0 },
      paperName: { $gt: '' },
      questionNumber: { $gt: 0 },
    },
  }
);

const DescriptiveQuestion = mongoose.model('DescriptiveQuestion', descriptiveQuestionSchema);
export default DescriptiveQuestion;
