import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    mockTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: [true, 'MockTest reference is required'],
    },
    answers: {
      type: Map,
      of: String,
      default: {}, // Maps questionId to selectedOption string
    },
    markedForReview: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    timeTakenSeconds: {
      type: Number,
    },
    score: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0, // percentage accuracy
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
export default TestAttempt;
