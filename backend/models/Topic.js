import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID reference is required'],
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
      required: [true, 'Exam Phase ID reference is required'],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subtopics: {
      type: [String],
      default: [],
    },
    estimatedStudyHours: {
      type: Number,
      default: 0,
    },
    recommendedStudyOrder: {
      type: Number,
      default: 0,
    },
    estimatedWeightage: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    questionTarget: {
      type: Number,
      default: 100,
    },
    pyqTarget: {
      type: Number,
      default: 10,
    },
    languageSupport: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'bilingual',
    },
    order: {
      type: Number,
      default: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

topicSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

const Topic = mongoose.model('Topic', topicSchema);
export default Topic;
