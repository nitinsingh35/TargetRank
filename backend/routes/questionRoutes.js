import express from 'express';
import multer from 'multer';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reviewQuestion,
  toggleBookmark,
  getBookmarks,
  getCSVTemplate,
  bulkUpload,
} from '../controllers/questionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import questionAvailabilityRoutes from './questionAvailabilityRoutes.js';

const router = express.Router();

// Multer memory storage configuration for CSV uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are supported.'), false);
    }
  },
});

// ─── PUBLIC / OPTIONALLY LOGGED-IN ENDPOINTS ───
// Anyone can view published questions, but we apply `protect` as optional inside getQuestions
// In routes, we pass through a helper to check token if present, but not block.
// Or we simply apply `protect` to check for active state and attach user, but handle empty auth context in controller.
// To support both public viewing and authenticated bookmark checks, let's wrap it appropriately.
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const checkUserOptional = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.active) {
        req.user = user;
      }
    } catch (err) {
      // ignore token error to allow public fallback
    }
  }
  next();
};

router.get('/', checkUserOptional, getQuestions);

router.use('/availability', questionAvailabilityRoutes);

// ─── PROTECTED USER ENDPOINTS (All Logged-in Roles) ───
router.post('/:id/bookmark', protect, toggleBookmark);
router.get('/bookmarks', protect, getBookmarks);

// ─── PRIVILEGED CREATOR/MODERATOR ENDPOINTS (Admin or Mentor) ───
router.post('/', protect, authorize('admin', 'mentor'), createQuestion);
router.put('/:id', protect, authorize('admin', 'mentor'), updateQuestion);
router.get('/template', protect, authorize('admin', 'mentor'), getCSVTemplate);
router.post('/bulk-upload', protect, authorize('admin', 'mentor'), upload.single('file'), bulkUpload);

// ─── ADMIN SPECIFIC ENDPOINTS ───
router.delete('/:id', protect, authorize('admin'), deleteQuestion);
router.post('/:id/review', protect, authorize('admin'), reviewQuestion);

export default router;
