import express from 'express';
import {
  createPaper,
  getPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  addQuestionToPaper,
  removeQuestionFromPaper,
  publishPaper,
} from '../controllers/adminPreviousYearPaperController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require logged-in admin access for all administrative PYQ management routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .post(createPaper)
  .get(getPapers);

router.route('/:id')
  .get(getPaperById)
  .put(updatePaper)
  .delete(deletePaper);

router.route('/:id/questions')
  .post(addQuestionToPaper);

router.route('/:id/questions/:questionId')
  .delete(removeQuestionFromPaper);

router.route('/:id/publish')
  .patch(publishPaper);

export default router;
