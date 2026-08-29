import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
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
    subtopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subtopic',
      default: null,
    },
    questionType: {
      type: String,
      enum: [
        'mcq',
        'multiple_select',
        'true_false',
        'assertion_reason',
        'match_the_following',
        'statement_based',
        'passage_based',
        'numerical',
        'descriptive',
        'interview',
        'case_study'
      ],
      default: 'mcq',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    questionHindi: {
      type: String,
      trim: true,
    },
    questionTextHindi: {
      type: String,
      trim: true,
    },
    options: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    correctAnswer: {
      type: String,
      trim: true,
      required: function() {
        return this.questionType !== 'multiple_select' && this.questionType !== 'descriptive' && this.questionType !== 'interview';
      }
    },
    correctAnswers: {
      type: [String],
      default: [],
      required: function() {
        return this.questionType === 'multiple_select';
      }
    },
    explanation: {
      type: String,
      trim: true,
    },
    explanationHindi: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      required: true,
    },
    marks: {
      type: Number,
      default: 2,
      min: [0, 'Marks must be non-negative'],
      required: true,
    },
    negativeMarks: {
      type: Number,
      default: 0.66,
      min: [0, 'Negative marks must be non-negative'],
      required: true,
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'english',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    sourceType: {
      type: String,
      enum: [
        'official_pyq',
        'official_answer_key',
        'original_practice',
        'licensed_content',
        'current_affairs',
        'other',
        'verified_previous_year',
        'pyq_inspired',
        'practice_generated',
        'mentor_created',
        'static_gk',
        'book_based_concept_practice',
        // new requested fields
        'original',
        'practice',
        'previous_year',
        'important',
        'book_based'
      ],
      default: 'original_practice',
      required: [true, 'Source type is required'],
    },
    sourceName: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true,
    },
    sourceExam: {
      type: String,
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    sourceYear: {
      type: Number,
      required: function() {
        return this.sourceType === 'official_pyq' || this.sourceType === 'previous_year' || this.isPreviousYearQuestion;
      }
    },
    paperName: {
      type: String,
      trim: true,
      required: function() {
        return this.sourceType === 'official_pyq' || this.sourceType === 'previous_year' || this.isPreviousYearQuestion;
      }
    },
    paperCode: {
      type: String,
      trim: true,
    },
    officialSourceName: {
      type: String,
      trim: true,
    },
    officialSourceUrl: {
      type: String,
      trim: true,
    },
    officialAnswerKeyUrl: {
      type: String,
      trim: true,
    },
    questionNumberInPaper: {
      type: Number,
    },
    sourceBook: {
      type: String,
      trim: true,
    },
    sourceChapter: {
      type: String,
      trim: true,
    },
    sourceReference: {
      type: String,
      trim: true,
    },
    copyrightStatus: {
      type: String,
      enum: ['original', 'public_domain', 'licensed', 'official_source_link', 'needs_review'],
      default: 'original',
    },
    isPreviousYearQuestion: {
      type: Boolean,
      default: false,
    },
    qualityStatus: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'archived', 'published'],
      default: 'draft',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
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
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    duplicateHash: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Backward compatibility metrics
    importanceLevel: {
      type: String,
      enum: ['basic', 'important', 'very_important', 'high_frequency', 'normal', 'must_do'],
      default: 'normal',
    },
    isHighWeightageTopic: {
      type: Boolean,
      default: false,
    },
    isFrequentlyAskedConcept: {
      type: Boolean,
      default: false,
    },
    recommendedBooks: {
      type: [String],
      default: [],
    },
    topicWeightage: {
      type: Number,
      default: 1,
    },
    qualityScore: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    correctAttemptCount: {
      type: Number,
      default: 0,
    },
    incorrectAttemptCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    currentAffairsMonth: {
      type: Number,
      min: 1,
      max: 12,
      required: function() { return this.sourceType === 'current_affairs'; },
    },
    currentAffairsYear: {
      type: Number,
      required: function() { return this.sourceType === 'current_affairs'; },
    },
    currentAffairsDate: {
      type: Date,
    },
    currentAffairsCategory: {
      type: String,
      enum: [
        'national', 'international', 'economy', 'environment', 'science_technology',
        'government_schemes', 'awards', 'sports', 'reports_indexes', 'state_special',
        'art_culture', 'defence', 'important_days', 'judiciary', 'social_issues', 'miscellaneous'
      ],
      required: function() { return this.sourceType === 'current_affairs'; },
    },
    sourcePublishedDate: {
      type: Date,
    },
    sourceReliability: {
      type: String,
      enum: ['official', 'high', 'medium'],
      required: function() { return this.sourceType === 'current_affairs'; },
    },
    sourceVerified: {
      type: Boolean,
      default: false,
    },
    sourceVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sourceVerifiedAt: {
      type: Date,
      default: null,
    },
    currentAffairsPackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CurrentAffairsPack',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate check to ensure specific question type rules are satisfied
questionSchema.pre('validate', function(next) {
  // Current affairs validation rules
  if (this.sourceType === 'current_affairs') {
    if (!this.sourceName) {
      this.invalidate('sourceName', 'Source Name is required for current affairs questions.');
    }
    if (this.isPublished) {
      if (!this.sourceVerified) {
        this.invalidate('sourceVerified', 'Current affairs questions must be verified before publishing.');
      }
      if (this.qualityStatus !== 'approved') {
        this.invalidate('qualityStatus', 'Current affairs questions must be approved before publishing.');
      }
    }
  }
  if (this.questionType === 'mcq') {
    if (!this.options || this.options.length < 2) {
      this.invalidate('options', 'MCQs must have at least 2 options.');
    }
    if (!this.correctAnswer || !this.options.includes(this.correctAnswer)) {
      this.invalidate('correctAnswer', 'Correct answer must match one of the options.');
    }
  }

  if (this.questionType === 'multiple_select') {
    if (!this.options || this.options.length < 2) {
      this.invalidate('options', 'Multiple select questions must have at least 2 options.');
    }
    if (!this.correctAnswers || this.correctAnswers.length < 2) {
      this.invalidate('correctAnswers', 'Multiple select questions must have at least 2 correct answers.');
    }
    for (const ans of this.correctAnswers) {
      if (!this.options.includes(ans)) {
        this.invalidate('correctAnswers', `Correct answer '${ans}' must match one of the options.`);
      }
    }
  }

  if (this.questionType === 'true_false') {
    if (!this.options || this.options.length < 2) {
      this.options = ['True', 'False'];
    }
    if (this.correctAnswer !== 'True' && this.correctAnswer !== 'False') {
      this.invalidate('correctAnswer', 'True/False questions must have a correct answer of True or False.');
    }
  }

  next();
});

// Pre-save duplicateHash generation
questionSchema.pre('save', function(next) {
  const norm = this.questionText.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
  const exam = this.examId ? this.examId.toString() : '';
  const subj = this.subjectId ? this.subjectId.toString() : '';
  const topic = this.topicId ? this.topicId.toString() : '';
  const yr = this.sourceYear || '';

  this.duplicateHash = `${norm}_${exam}_${subj}_${topic}_${yr}`;
  next();
});

// Indexes for high performance scaling
questionSchema.index({ examId: 1, phaseId: 1, subjectId: 1, topicId: 1 });
questionSchema.index({ qualityStatus: 1, isPublished: 1, isVerified: 1 });
questionSchema.index({ duplicateHash: 1 }, { unique: true, sparse: true });

// Added compound and query support indexes for Smart Selection Engine
questionSchema.index({ examId: 1, phaseId: 1, subjectId: 1, topicId: 1, isPublished: 1, isVerified: 1, qualityStatus: 1 });
questionSchema.index({ sourceType: 1, isPreviousYearQuestion: 1, sourceYear: -1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ language: 1 });
questionSchema.index({ tags: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
