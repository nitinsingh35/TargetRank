import express from 'express';
import {
  getSubmittedAnswers,
  assignMentor,
  reviewAnswer,
  returnAnswer,
} from '../controllers/mentorAnswerReviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require logged-in authentication for all mentor descriptive review routes
router.use(protect);

router.get('/', getSubmittedAnswers);
router.post('/:id/assign', authorize('admin'), assignMentor);
router.post('/:id/review', reviewAnswer);
router.post('/:id/return', returnAnswer);

export default router;
