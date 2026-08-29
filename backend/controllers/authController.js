import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper: generate signed JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper: build safe user response
const userResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  active: user.active,
  selectedExams: user.selectedExams,
  createdAt: user.createdAt,
  token,
});

// ─────────────────────────────────────────────────
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, selectedExams } = req.body;

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'aspirant',
      phone: phone || '',
      selectedExams: selectedExams || [],
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to TargetRank.',
      token,
      user: userResponse(user, token),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user including password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userResponse(user, token),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Protected
// ─────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Protected
// ─────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Allowed fields to update
    const { name, phone, avatar, selectedExams, password } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (selectedExams !== undefined) user.selectedExams = selectedExams;

    // Update password only if provided
    if (password) {
      user.password = password; // pre-save hook will hash it
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: userResponse(updatedUser, token),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Public
// ─────────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully. See you soon!' });
};
