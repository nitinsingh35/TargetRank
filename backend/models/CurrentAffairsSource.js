import mongoose from 'mongoose';

const currentAffairsSourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    publisherName: {
      type: String,
      required: [true, 'Publisher name is required'],
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
      required: function() {
        return this.sourceCategory !== 'original_summary';
      },
    },
    publicationDate: {
      type: Date,
    },
    sourceCategory: {
      type: String,
      enum: ['government', 'official_report', 'international_organization', 'press_release', 'newspaper', 'original_summary', 'other'],
      required: [true, 'Source category is required'],
    },
    reliabilityLevel: {
      type: String,
      enum: ['official', 'high', 'medium'],
      required: [true, 'Reliability level is required'],
    },
    summary: {
      type: String,
      trim: true,
      required: function() {
        return this.sourceCategory === 'original_summary';
      },
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'archived'],
      default: 'draft',
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

// Validation rules
currentAffairsSourceSchema.pre('validate', function(next) {
  if (this.status === 'approved' && !this.isVerified) {
    this.invalidate('status', 'Source cannot be approved unless verified (isVerified is true).');
  }
  next();
});

// Indexes
currentAffairsSourceSchema.index({ publicationDate: 1, status: 1 });
currentAffairsSourceSchema.index({ sourceCategory: 1, reliabilityLevel: 1 });
currentAffairsSourceSchema.index({ isVerified: 1, status: 1 });

const CurrentAffairsSource = mongoose.model('CurrentAffairsSource', currentAffairsSourceSchema);
export default CurrentAffairsSource;
