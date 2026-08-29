import mongoose from 'mongoose';

const questionCollectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Collection title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPhase',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    },
    collectionType: {
      type: String,
      enum: ['pyq_paper', 'topic_pack', 'practice_set', 'revision_pack', 'current_affairs_pack', 'mentor_pack', 'full_mock'],
      default: 'practice_set',
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
    totalQuestions: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
    },
    paperName: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

questionCollectionSchema.index({ examId: 1, collectionType: 1 });

const QuestionCollection = mongoose.model('QuestionCollection', questionCollectionSchema);
export default QuestionCollection;
