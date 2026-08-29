import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: {
    message: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public Routes ──────────────────────────────────
router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login',    authLimiter, validateLogin,    loginUser);
router.post('/logout',   logoutUser);

// ── Protected Routes ───────────────────────────────
router.get('/me',          protect, getMe);
router.put('/profile',     protect, validateProfileUpdate, updateProfile);

export default router;
