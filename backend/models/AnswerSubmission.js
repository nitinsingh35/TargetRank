import mongoose from 'mongoose';

const answerSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    descriptiveQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DescriptiveQuestion',
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
    answerText: {
      type: String,
      default: '',
    },
    answerFileUrl: {
      type: String,
      default: '',
    },
    answerFileName: {
      type: String,
      default: '',
    },
    answerFileType: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'reviewed', 'returned'],
      default: 'draft',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
    assignedMentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    mentorFeedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorFeedback',
      default: null,
    },
    aspirantSelfRating: {
      type: String,
      enum: ['poor', 'average', 'good', 'excellent'],
      default: null,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Quick lookup queries
answerSubmissionSchema.index({ userId: 1 });
answerSubmissionSchema.index({ descriptiveQuestionId: 1 });
answerSubmissionSchema.index({ status: 1 });
answerSubmissionSchema.index({ submittedAt: -1 });

// User is allowed to create multiple submissions for the same descriptive question,
// so we DO NOT enforce a unique index constraint here.

const AnswerSubmission = mongoose.model('AnswerSubmission', answerSubmissionSchema);
export default AnswerSubmission;
