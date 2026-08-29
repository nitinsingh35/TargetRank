import express from 'express';
import {
  createSmartSession,
  getPracticeSessionDetails,
  savePracticeAnswer,
  submitPracticeSession,
  getPracticeSessionResult,
  getPracticeHistory,
  getPracticeRecommendations,
  getAvailableQuestionCount,
  abandonPracticeSession,
  getPracticeConfig,
  getMyPracticeSessions,
  deletePracticeSession,
  getAvailableQuestionCountEnhanced,
} from '../controllers/practiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/config/:examId/:phaseId', getPracticeConfig);

// Protected routes - all practice workflows require authentication
router.use(protect);

// Practice session creation and management
router.post('/create-smart-session', createSmartSession);
router.get('/sessions/:id', getPracticeSessionDetails);
router.post('/sessions/:id/save-answer', savePracticeAnswer);
router.post('/sessions/:id/submit', submitPracticeSession);
router.get('/sessions/:id/result', getPracticeSessionResult);
router.post('/sessions/:id/abandon', abandonPracticeSession);
router.delete('/sessions/:id', deletePracticeSession);

// User's practice sessions
router.get('/my-sessions', getMyPracticeSessions);
router.get('/history', getPracticeHistory);
router.get('/recommendations', getPracticeRecommendations);

// Question availability (supports filters for Smart Practice page)
router.get('/available-question-count', getAvailableQuestionCountEnhanced);

export default router;
