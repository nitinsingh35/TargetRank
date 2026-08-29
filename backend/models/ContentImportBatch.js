import mongoose from 'mongoose';

const contentImportBatchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      enum: ['csv', 'json', 'question_set'],
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    pendingReviewRows: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['queued', 'validating', 'importing', 'completed', 'failed'],
      default: 'queued',
    },
    errors: [
      {
        rowNumber: Number,
        data: mongoose.Schema.Types.Mixed,
        message: String,
      }
    ],
    sourceMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

contentImportBatchSchema.index({ uploadedBy: 1, status: 1, createdAt: -1 });

const ContentImportBatch = mongoose.model('ContentImportBatch', contentImportBatchSchema);
export default ContentImportBatch;
