import express from 'express';
import {
  getMockTests,
  getMockTestById,
  startAttempt,
  saveAttemptProgress,
  submitAttempt,
  getAttemptResult,
  generateCustomPractice,
  createMockTest,
  updateMockTest,
  deleteMockTest,
} from '../controllers/testController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All mock test actions require logged in users
router.use(protect);

router.get('/', getMockTests);
router.post('/custom-practice', generateCustomPractice);
router.get('/:id', getMockTestById);
router.post('/:id/start', startAttempt);

// Attempt and result workflows
router.post('/attempts/:attemptId/save', saveAttemptProgress);
router.post('/attempts/:attemptId/submit', submitAttempt);
router.get('/attempts/:attemptId/result', getAttemptResult);

// Admin/Mentor moderation
router.post('/', authorize('admin', 'mentor'), createMockTest);
router.put('/:id', authorize('admin', 'mentor'), updateMockTest);
router.delete('/:id', authorize('admin', 'mentor'), deleteMockTest);

export default router;
