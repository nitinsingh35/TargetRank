import express from 'express';
import {
  getPublishedMockTests,
  getMockTestDetails,
  startMockTestAttempt,
  resumeMockTestAttempt,
  saveMockAnswer,
  markMockReview,
  toggleMockBookmark,
  submitMockTestAttempt,
  autoSubmitMockTestAttempt,
  getMockTestResult,
  getMyMockTestAttempts,
} from '../controllers/mockTestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all mock test actions
router.use(protect);

router.get('/', getPublishedMockTests);
router.get('/my-attempts', getMyMockTestAttempts);

router.route('/:id')
  .get(getMockTestDetails);

router.post('/:id/start', startMockTestAttempt);

router.route('/attempts/:attemptId')
  .get(resumeMockTestAttempt);

router.post('/attempts/:attemptId/save-answer', saveMockAnswer);
router.post('/attempts/:attemptId/mark-review', markMockReview);
router.post('/attempts/:attemptId/bookmark', toggleMockBookmark);
router.post('/attempts/:attemptId/submit', submitMockTestAttempt);
router.post('/attempts/:attemptId/auto-submit', autoSubmitMockTestAttempt);
router.get('/attempts/:attemptId/result', getMockTestResult);

export default router;
