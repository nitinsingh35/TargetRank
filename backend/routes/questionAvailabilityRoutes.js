import express from 'express';
import { getQuestionAvailabilityMetrics } from '../controllers/questionAvailabilityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require logged-in aspirant/admin/mentor
router.get('/', protect, getQuestionAvailabilityMetrics);

export default router;
