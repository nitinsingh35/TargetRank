import express from 'express';
import {
  getLibraryStats,
  listLibraryQuestions,
  bulkOperations,
  getLibraryAnalytics,
} from '../controllers/adminQuestionLibraryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin protection to all routes in this sub-module
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getLibraryStats);
router.get('/list', listLibraryQuestions);
router.get('/analytics', getLibraryAnalytics);
router.post('/bulk-update', bulkOperations);

export default router;
