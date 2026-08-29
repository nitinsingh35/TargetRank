import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'mentor', 'aspirant'],
        message: 'Role must be one of: admin, mentor, aspirant',
      },
      default: 'aspirant',
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
      match: [/^[0-9+\-\s()]{0,15}$/, 'Please provide a valid phone number'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    selectedExams: {
      type: [String],
      default: [],
      enum: {
        values: ['UPSC', 'BPSC', 'UPPSC', 'SSC CGL', 'Banking', 'Railway', 'Defence', 'State PCS'],
        message: '{VALUE} is not a supported exam',
      },
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password field has been modified
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
