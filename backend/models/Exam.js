import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
    },
    fullDescription: {
      type: String,
      trim: true,
    },
    conductingBody: {
      type: String,
      trim: true,
    },
    eligibility: {
      type: String,
      trim: true,
    },
    examPattern: {
      type: String,
      trim: true,
    },
    importantDates: [
      {
        title: { type: String, required: true },
        dateString: { type: String, required: true },
      }
    ],
    image: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['civil_services', 'state_psc', 'ssc', 'banking', 'railway', 'defence', 'gk', 'other'],
      default: 'other',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
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

examSchema.index({ active: 1, isArchived: 1, displayOrder: 1 }
);

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
