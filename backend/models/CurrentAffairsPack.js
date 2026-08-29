import mongoose from 'mongoose';

const currentAffairsPackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      required: [true, 'Language is required'],
    },
    examIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
      }
    ],
    phaseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamPhase',
      }
    ],
    categories: {
      type: [String],
      enum: [
        'national', 'international', 'economy', 'environment', 'science_technology',
        'government_schemes', 'awards', 'sports', 'reports_indexes', 'state_special',
        'art_culture', 'defence', 'important_days', 'judiciary', 'social_issues', 'miscellaneous'
      ],
      validate: [
        {
          validator: function(v) {
            return Array.isArray(v) && v.length > 0;
          },
          message: 'At least one category is required',
        }
      ],
    },
    sourceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CurrentAffairsSource',
      }
    ],
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
    totalQuestions: {
      type: Number,
      default: 0,
    },
    estimatedPracticeMinutes: {
      type: Number,
      default: 30,
    },
    difficultyMix: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'published', 'archived'],
      default: 'draft',
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
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate check for status transitions and duplicate prevention
currentAffairsPackSchema.pre('validate', async function(next) {
  // Slugify title
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Prevent duplicate packs for same month + year + exam + language + title.
  if (this.isModified('month') || this.isModified('year') || this.isModified('language') || this.isModified('title') || this.isModified('examIds')) {
    const query = {
      _id: { $ne: this._id },
      month: this.month,
      year: this.year,
      language: this.language,
      title: this.title,
      examIds: { $in: this.examIds || [] }
    };
    try {
      const existing = await mongoose.models.CurrentAffairsPack.findOne(query);
      if (existing) {
        this.invalidate('title', 'A current affairs pack with same month, year, language, title and exam already exists.');
      }
    } catch (err) {
      return next(err);
    }
  }

  next();
});

// Indexes
currentAffairsPackSchema.index({ month: 1, year: 1, status: 1 });
currentAffairsPackSchema.index({ examIds: 1, isPublished: 1 });
currentAffairsPackSchema.index({ categories: 1, isPublished: 1 });

const CurrentAffairsPack = mongoose.model('CurrentAffairsPack', currentAffairsPackSchema);
export default CurrentAffairsPack;
