import mongoose from 'mongoose';

const questionImportBatchSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user ID is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['csv', 'json', 'xlsx'],
      required: [true, 'File type is required'],
    },
    fieldMapping: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    duplicateStance: {
      type: String,
      enum: ['skip', 'replace', 'keep_both'],
      default: 'skip',
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
      trim: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    validRows: {
      type: Number,
      default: 0,
    },
    invalidRows: {
      type: Number,
      default: 0,
    },
    duplicateRows: {
      type: Number,
      default: 0,
    },
    importedRows: {
      type: Number,
      default: 0,
    },
    rejectedRows: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'uploaded',
        'previewed',
        'validating',
        'validated',
        'importing',
        'completed',
        'failed',
        'rolled_back'
      ],
      default: 'uploaded',
      required: true,
    },
    previewRows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    validationSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorReport: [
      {
        row: { type: Number },
        questionText: { type: String },
        errors: [{ type: String }],
        warning: { type: Boolean, default: false }
      }
    ],
    importedQuestionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
    rollbackAllowed: {
      type: Boolean,
      default: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const QuestionImportBatch = mongoose.model('QuestionImportBatch', questionImportBatchSchema);
export default QuestionImportBatch;
