import mongoose from 'mongoose';

const topicWeightageSchema = new mongoose.Schema(
  {
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
    weightageLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium',
    },
    estimatedQuestionFrequency: {
      type: String, // e.g. "2-3 questions per year"
      trim: true,
    },
    basedOn: {
      type: String,
      enum: ['pyq_analysis', 'mentor_review', 'syllabus_importance'],
      default: 'pyq_analysis',
    },
    notes: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

topicWeightageSchema.index({ examId: 1, phaseId: 1, topicId: 1 }, { unique: true });

const TopicWeightage = mongoose.model('TopicWeightage', topicWeightageSchema);
export default TopicWeightage;
