import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getAspirantTutorials,
  getAspirantTutorialById,
  getRecommendedTutorials
} from '../controllers/tutorialController.js';
import {
  updateProgress,
  getMyLearningProgress
} from '../controllers/tutorialProgressController.js';

const router = express.Router();

// All student learning routes are protected
router.get('/', protect, getAspirantTutorials);
router.get('/recommended', protect, getRecommendedTutorials);
router.get('/my-progress', protect, getMyLearningProgress);
router.get('/:id', protect, getAspirantTutorialById);
router.post('/:id/progress', protect, updateProgress);

export default router;
