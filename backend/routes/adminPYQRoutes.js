import express from 'express';
import {
  createPYQPaper,
  getPYQPapers,
  getPYQPaperDetails,
  updatePYQPaper,
  deletePYQPaper,
  validatePYQPaper,
  publishPYQPaper,
  archivePYQPaper,
  duplicatePYQPaper,
  getPYQPaperAnalytics,
} from '../controllers/adminPYQController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce admin-only access
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .post(createPYQPaper)
  .get(getPYQPapers);

router.route('/:id')
  .get(getPYQPaperDetails)
  .put(updatePYQPaper)
  .delete(deletePYQPaper);

router.post('/:id/validate', validatePYQPaper);
router.post('/:id/publish', publishPYQPaper);
router.post('/:id/archive', archivePYQPaper);
router.post('/:id/duplicate', duplicatePYQPaper);
router.get('/:id/analytics', getPYQPaperAnalytics);

export default router;
