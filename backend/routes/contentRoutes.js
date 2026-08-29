import express from 'express';
import multer from 'multer';
import {
  importCSV,
  importJSON,
  getCSVTemplate,
  getJSONTemplate,
  getImportBatches,
  getImportBatchById,
  getContentCoverage,
  getCoverageGaps,
} from '../controllers/contentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Content pipelines require logged in admins or mentors
router.use(protect);
router.use(authorize('admin', 'mentor'));

// Bulk Uploads
router.post('/import/csv', upload.single('file'), importCSV);
router.post('/import/json', upload.single('file'), importJSON);

// Templates download
router.get('/import/template/csv', getCSVTemplate);
router.get('/import/template/json', getJSONTemplate);

// Batches history
router.get('/import/batches', getImportBatches);
router.get('/import/batches/:id', getImportBatchById);

// Coverage targets and Gaps
router.get('/coverage', getContentCoverage);
router.get('/gaps', getCoverageGaps);

export default router;
