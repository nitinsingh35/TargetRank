import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question ID is required'],
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
    },
    practiceSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeSession',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt is needed as per spec, but standard timestamps is also fine
  }
);

// Unique compound index for userId + questionId to prevent duplicate bookmarks
bookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// Secondary lookup indexes for performance
bookmarkSchema.index({ examId: 1, phaseId: 1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
