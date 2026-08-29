import mongoose from 'mongoose';

const userQuestionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
      required: true,
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
    attemptCount: {
      type: Number,
      default: 1,
    },
    lastAttemptedAt: {
      type: Date,
      default: Date.now,
    },
    lastResult: {
      type: String,
      enum: ['correct', 'incorrect', 'skipped'],
      required: true,
    },
    lastPracticeSessionId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    confidenceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

userQuestionHistorySchema.index({ userId: 1, questionId: 1 }, { unique: true });
userQuestionHistorySchema.index({ userId: 1, lastAttemptedAt: -1 });

const UserQuestionHistory = mongoose.model('UserQuestionHistory', userQuestionHistorySchema);
export default UserQuestionHistory;
