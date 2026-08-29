import mongoose from 'mongoose';

const factBankSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
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
    factText: {
      type: String,
      required: [true, 'Fact text is required'],
      trim: true,
    },
    sourceReference: {
      type: String,
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'bilingual'],
      default: 'english',
    },
  },
  {
    timestamps: true,
  }
);

factBankSchema.index({ examId: 1, subjectId: 1, topicId: 1 });

const FactBank = mongoose.model('FactBank', factBankSchema);
export default FactBank;
