import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Subject title is required'],
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
    order: {
      type: Number,
      default: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    estimatedWeightage: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    icon: {
      type: String,
      default: '',
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

subjectSchema.index({ phaseId: 1, slug: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
