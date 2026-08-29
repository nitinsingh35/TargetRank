import mongoose from 'mongoose';

const contentCoverageTargetSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    targetQuestionCount: {
      type: Number,
      default: 1000,
    },
    targetPYQCount: {
      type: Number,
      default: 100,
    },
    targetEasyCount: {
      type: Number,
      default: 300,
    },
    targetMediumCount: {
      type: Number,
      default: 500,
    },
    targetHardCount: {
      type: Number,
      default: 200,
    },
    currentPublishedCount: {
      type: Number,
      default: 0,
    },
    currentPYQCount: {
      type: Number,
      default: 0,
    },
    coverageStatus: {
      type: String,
      enum: ['critical_gap', 'moderate_gap', 'sufficient', 'target_achieved'],
      default: 'critical_gap',
    },
  },
  {
    timestamps: true,
  }
);

contentCoverageTargetSchema.index({ examId: 1, subjectId: 1, topicId: 1 }, { unique: true });

const ContentCoverageTarget = mongoose.model('ContentCoverageTarget', contentCoverageTargetSchema);
export default ContentCoverageTarget;
