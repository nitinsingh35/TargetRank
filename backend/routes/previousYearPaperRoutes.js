import express from 'express';
import {
  getPublishedPapers,
  getPaperDetails,
  startPaperAttempt,
  resumeAttempt,
  saveAttemptAnswer,
  toggleAttemptReview,
  submitPaperAttempt,
  autoSubmitPaperAttempt,
  getAttemptResult,
  getAttemptHistory,
} from '../controllers/previousYearPaperController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require logged-in authentication for all aspirant PYQ simulator routes
router.use(protect);

router.get('/', getPublishedPapers);
router.get('/attempt-history', getAttemptHistory);

router.get('/:id', getPaperDetails);
router.post('/:id/start', startPaperAttempt);

router.get('/attempts/:attemptId', resumeAttempt);
router.post('/attempts/:attemptId/save-answer', saveAttemptAnswer);
router.post('/attempts/:attemptId/mark-review', toggleAttemptReview);
router.post('/attempts/:attemptId/submit', submitPaperAttempt);
router.post('/attempts/:attemptId/auto-submit', autoSubmitPaperAttempt);
router.get('/attempts/:attemptId/result', getAttemptResult);

export default router;
