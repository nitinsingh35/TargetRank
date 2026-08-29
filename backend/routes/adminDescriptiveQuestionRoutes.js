import express from 'express';
import {
  createDescriptiveQuestion,
  getDescriptiveQuestions,
  getDescriptiveQuestionById,
  updateDescriptiveQuestion,
  deleteDescriptiveQuestion,
  publishDescriptiveQuestion,
} from '../controllers/adminDescriptiveQuestionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce logged-in admin validation on descriptive question routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .post(createDescriptiveQuestion)
  .get(getDescriptiveQuestions);

router.route('/:id')
  .get(getDescriptiveQuestionById)
  .put(updateDescriptiveQuestion)
  .delete(deleteDescriptiveQuestion);

router.route('/:id/publish')
  .patch(publishDescriptiveQuestion);

export default router;
