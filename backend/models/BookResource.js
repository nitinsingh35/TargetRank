import mongoose from 'mongoose';

const bookResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    examIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
      }
    ],
    subjectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      }
    ],
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      }
    ],
    resourceType: {
      type: String,
      enum: ['book', 'ncert', 'government_report', 'standard_reference', 'official_document'],
      default: 'book',
    },
    edition: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    purchaseOrReferenceLink: {
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

bookResourceSchema.index({ examIds: 1, subjectIds: 1 });

const BookResource = mongoose.model('BookResource', bookResourceSchema);
export default BookResource;
