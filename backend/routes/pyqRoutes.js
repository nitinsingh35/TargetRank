import express from 'express';
import {
  getPublishedPYQPapers,
  getPYQPaperDetails,
  startPYQAttempt,
  resumePYQAttempt,
  savePYQAnswer,
  markPYQReview,
  togglePYQBookmark,
  submitPYQAttempt,
  autoSubmitPYQAttempt,
  getPYQResult,
  getMyAttempts,
  getMyComparison,
} from '../controllers/pyqController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce auth for all PYQ simulator routes
router.use(protect);

router.get('/', getPublishedPYQPapers);
router.get('/my-attempts', getMyAttempts);
router.get('/my-comparison', getMyComparison);

router.route('/:id')
  .get(getPYQPaperDetails);

router.post('/:id/start', startPYQAttempt);

router.route('/attempts/:attemptId')
  .get(resumePYQAttempt);

router.post('/attempts/:attemptId/save-answer', savePYQAnswer);
router.post('/attempts/:attemptId/mark-review', markPYQReview);
router.post('/attempts/:attemptId/bookmark', togglePYQBookmark);
router.post('/attempts/:attemptId/submit', submitPYQAttempt);
router.post('/attempts/:attemptId/auto-submit', autoSubmitPYQAttempt);
router.get('/attempts/:attemptId/result', getPYQResult);

export default router;
