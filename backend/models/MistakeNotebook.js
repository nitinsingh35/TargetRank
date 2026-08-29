import mongoose from 'mongoose';

const mistakeNotebookSchema = new mongoose.Schema(
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
    testAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    selectedAnswer: {
      type: String,
      trim: true,
    },
    correctAnswer: {
      type: String,
      trim: true,
    },
    explanationSnapshot: {
      type: String,
      trim: true,
    },
    mistakeReason: {
      type: String,
      enum: ['concept_gap', 'silly_mistake', 'time_management', 'guess', 'unknown'],
      default: 'unknown',
    },
    personalNote: {
      type: String,
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

mistakeNotebookSchema.index({ userId: 1, resolved: 1 });
mistakeNotebookSchema.index({ userId: 1, questionId: 1 }, { unique: true });

const MistakeNotebook = mongoose.model('MistakeNotebook', mistakeNotebookSchema);
export default MistakeNotebook;
