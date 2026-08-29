import express from 'express';
import {
  getMockTestTemplates,
  createMockTest,
  getMockTests,
  getMockTestDetails,
  updateMockTest,
  deleteMockTest,
  previewAvailability,
  publishMockTest,
  archiveMockTest,
  duplicateMockTest,
  getMockTestAnalytics,
} from '../controllers/adminMockTestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce admin-only access for all mock test management routes
router.use(protect);
router.use(authorize('admin'));

router.get('/templates', getMockTestTemplates);

router.route('/')
  .post(createMockTest)
  .get(getMockTests);

router.route('/:id')
  .get(getMockTestDetails)
  .put(updateMockTest)
  .delete(deleteMockTest);

router.post('/:id/preview-availability', previewAvailability);
router.post('/:id/publish', publishMockTest);
router.post('/:id/archive', archiveMockTest);
router.post('/:id/duplicate', duplicateMockTest);
router.get('/:id/analytics', getMockTestAnalytics);

export default router;
