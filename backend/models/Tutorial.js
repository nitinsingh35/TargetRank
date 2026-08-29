import mongoose from 'mongoose';

const tutorialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tutorial title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
    },
    fullDescription: {
      type: String,
      trim: true,
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    },
    subtopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subtopic',
    },
    tutorialType: {
      type: String,
      enum: {
        values: ['video', 'article', 'notes', 'pdf', 'external_link', 'recorded_class'],
        message: 'Invalid tutorial type',
      },
      required: true,
    },
    contentLanguage: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'english',
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    articleContent: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    externalUrl: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    orderNumber: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'published', 'archived'],
      default: 'draft',
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

// Indexes for fast lookup
tutorialSchema.index({ slug: 1 });
tutorialSchema.index({ examIds: 1 });
tutorialSchema.index({ subjectId: 1, topicId: 1 });
tutorialSchema.index({ status: 1 });

const Tutorial = mongoose.model('Tutorial', tutorialSchema);
export default Tutorial;
