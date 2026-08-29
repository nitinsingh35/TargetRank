import express from 'express';
import {
  getExams,
  getAllExamsAdmin,
  getExamBySlug,
  createExam,
  updateExam,
  deleteExam,
  getExamSyllabus,
  createPhase,
  updatePhase,
  deletePhase,
  createSubject,
  updateSubject,
  deleteSubject,
  createTopic,
  updateTopic,
  deleteTopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  getSubtopicsOfTopic,
  togglePublish,
  toggleArchive,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── PUBLIC ROUTES ───
router.get('/', getExams);
router.get('/:id/syllabus', getExamSyllabus);
router.get('/topics/:topicId/subtopics', getSubtopicsOfTopic);
router.get('/:slug', getExamBySlug);

// ─── ADMIN PROTECTED ROUTES ───
router.use(protect, authorize('admin'));

router.get('/admin/all', getAllExamsAdmin);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

// Publish / Archive toggles
router.patch('/:nodeType/:id/publish', togglePublish);
router.patch('/:nodeType/:id/archive', toggleArchive);

// Phases
router.post('/:examId/phases', createPhase);
router.put('/phases/:id', updatePhase);
router.delete('/phases/:id', deletePhase);

// Subjects
router.post('/:examId/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Topics
router.post('/:examId/topics', createTopic);
router.put('/topics/:id', updateTopic);
router.delete('/topics/:id', deleteTopic);

// Subtopics
router.post('/:examId/subtopics', createSubtopic);
router.put('/subtopics/:id', updateSubtopic);
router.delete('/subtopics/:id', deleteSubtopic);

export default router;
