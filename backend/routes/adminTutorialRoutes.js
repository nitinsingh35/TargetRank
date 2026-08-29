import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createTutorial,
  getAdminTutorials,
  getAdminTutorialById,
  updateTutorial,
  publishTutorial,
  archiveTutorial,
  deleteTutorial
} from '../controllers/tutorialController.js';

const router = express.Router();

// Role gate verification helper (admin check)
const authorizeAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'mentor')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
};

router.use(protect);
router.use(authorizeAdmin);

router.route('/')
  .post(createTutorial)
  .get(getAdminTutorials);

router.route('/:id')
  .get(getAdminTutorialById)
  .put(updateTutorial)
  .delete(deleteTutorial);

router.post('/:id/publish', publishTutorial);
router.post('/:id/archive', archiveTutorial);

export default router;
