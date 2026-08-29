import mongoose from 'mongoose';

const subtopicSchema = new mongoose.Schema(
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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic ID reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Subtopic title is required'],
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
    recommendedStudyOrder: {
      type: Number,
      default: 0,
    },
    estimatedWeightage: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedStudyHours: {
      type: Number,
      default: 1,
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    questionTarget: {
      type: Number,
      default: 50,
    },
    pyqTarget: {
      type: Number,
      default: 5,
    },
    languageSupport: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'bilingual',
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
    displayOrder: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
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

// Compound index to guarantee uniqueness of a subtopic under a specific topic
subtopicSchema.index({ topicId: 1, slug: 1 }, { unique: true });

const Subtopic = mongoose.model('Subtopic', subtopicSchema);
export default Subtopic;
