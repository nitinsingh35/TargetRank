import express from 'express';
import {
  getSyllabusTree,
  importSyllabus,
  updateTopicSettings,
  getSyllabusCoverage,
} from '../controllers/adminSyllabusController.js';
import {
  listExams,
  listPhases,
  listSubjects,
  listTopics,
  listSubtopics,
  getFullSyllabusTree,
  getSyllabusStats,
} from '../controllers/syllabusManagementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require auth and admin role
router.use(protect);
router.use(authorize('admin'));

// Legacy tree + import + coverage
router.get('/tree', getSyllabusTree);
router.post('/import', importSyllabus);
router.put('/topics/:id', updateTopicSettings);
router.get('/coverage', getSyllabusCoverage);

// New full tree (faster, public-friendly)
router.get('/full-tree', getFullSyllabusTree);

// Stats
router.get('/stats', getSyllabusStats);

// Paginated list endpoints
router.get('/list/exams', listExams);
router.get('/list/phases', listPhases);
router.get('/list/subjects', listSubjects);
router.get('/list/topics', listTopics);
router.get('/list/subtopics', listSubtopics);

export default router;

