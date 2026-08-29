import mongoose from 'mongoose';

const questionReportSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['wrong_answer', 'unclear_explanation', 'duplicate', 'outdated', 'typo', 'other'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'rejected'],
      default: 'open',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

questionReportSchema.index({ status: 1, questionId: 1 });

const QuestionReport = mongoose.model('QuestionReport', questionReportSchema);
export default QuestionReport;
