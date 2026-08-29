import mongoose from 'mongoose';

const mentorFeedbackSchema = new mongoose.Schema(
  {
    answerSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerSubmission',
      required: true,
      unique: true, // Guarantees one feedback record per answer submission
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    marksAwarded: {
      type: Number,
      required: [true, 'Marks awarded is required'],
      min: [0, 'Marks awarded cannot be negative'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Max marks limit is required'],
      min: [1, 'Max marks must be greater than 0'],
    },
    overallFeedback: {
      type: String,
      required: [true, 'Overall feedback text is required'],
      trim: true,
    },
    introductionFeedback: {
      type: String,
      trim: true,
      default: '',
    },
    bodyFeedback: {
      type: String,
      trim: true,
      default: '',
    },
    conclusionFeedback: {
      type: String,
      trim: true,
      default: '',
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    keywordCoverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    structureRating: {
      type: String,
      enum: ['poor', 'average', 'good', 'excellent'],
      default: 'average',
    },
    contentRating: {
      type: String,
      enum: ['poor', 'average', 'good', 'excellent'],
      default: 'average',
    },
    presentationRating: {
      type: String,
      enum: ['poor', 'average', 'good', 'excellent'],
      default: 'average',
    },
    suggestedAnswerApproach: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Validation Rules ──────────────────────────────────────────────────────────
mentorFeedbackSchema.pre('validate', function(next) {
  if (this.marksAwarded > this.maxMarks) {
    this.invalidate('marksAwarded', 'Marks awarded cannot exceed max marks available.');
  }
  next();
});

const MentorFeedback = mongoose.model('MentorFeedback', mentorFeedbackSchema);
export default MentorFeedback;
