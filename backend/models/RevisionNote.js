import mongoose from 'mongoose';

/**
 * RevisionNote
 * Stores a user's personal written note for a specific question in their
 * revision queue. One note per (userId, questionId) pair — re-saving
 * overwrites the existing note via upsert (findOneAndUpdate + upsert:true).
 */
const revisionNoteSchema = new mongoose.Schema(
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
    revisionItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RevisionItem',
    },
    noteText: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Note cannot exceed 5000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ── Unique compound index ─────────────────────────────────────────────────────
// Guarantees one note record per (user, question).
// Controllers must use findOneAndUpdate({ userId, questionId }, ..., { upsert: true })
// so that re-saving a note updates the existing record rather than inserting a duplicate.
revisionNoteSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// Fast lookup by revisionItemId (e.g., fetch all notes for a revision session)
revisionNoteSchema.index({ revisionItemId: 1 });

const RevisionNote = mongoose.model('RevisionNote', revisionNoteSchema);
export default RevisionNote;
