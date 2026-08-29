import mongoose from 'mongoose';

const examPracticeConfigSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      unique: true, // Config per exam
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
    },
    defaultMinutesPerQuestion: {
      type: Number,
      default: 1.5, // e.g. 1.5 mins per question
    },
    defaultMarksPerQuestion: {
      type: Number,
      default: 2,
    },
    defaultNegativeMarks: {
      type: Number,
      default: 0.66,
    },
    fullMockDurationMinutes: {
      type: Number,
      default: 120,
    },
    fullMockQuestionCount: {
      type: Number,
      default: 100,
    },
    sectionRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // e.g. section question distributions
    },
    active: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const ExamPracticeConfig = mongoose.model('ExamPracticeConfig', examPracticeConfigSchema);
export default ExamPracticeConfig;
