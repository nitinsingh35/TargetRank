import express from 'express';
import {
  getQuestions,
  getQuestionById,
  createSubmission,
  saveDraft,
  submitAnswer,
  getSubmissionHistory,
  getSubmissionById,
  toggleSubmissionBookmark,
  getAnswerWritingAnalytics,
} from '../controllers/answerWritingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require logged-in authentication for all aspirant mains answer-writing routes
router.use(protect);

router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestionById);
router.get('/analytics', getAnswerWritingAnalytics);

router.route('/submissions')
  .post(createSubmission)
  .get(getSubmissionHistory);

router.get('/submissions/:id', getSubmissionById);
router.put('/submissions/:id/draft', saveDraft);
router.post('/submissions/:id/submit', submitAnswer);
router.post('/submissions/:id/bookmark', toggleSubmissionBookmark);

export default router;
