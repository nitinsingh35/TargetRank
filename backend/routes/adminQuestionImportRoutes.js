import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadImportFile,
  previewImportFile,
  validateImportFile,
  commitImportFile,
  getImportBatches,
  getImportBatchById,
  getImportBatchErrors,
  rollbackImportBatch,
  getImportStats,
  getSampleTemplateFile,
  retryFailedRows,
  approveQuestion,
  rejectQuestion,
  publishQuestion,
  bulkApproveQuestions,
  bulkTagQuestions,
  bulkPublishQuestions
} from '../controllers/adminQuestionImportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Setup file uploads storage directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || ext === '.json' || ext === '.xlsx' || ext === '.xls') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, JSON, and Excel (.xlsx) formats are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// Route restrictions: only Admin role allowed
router.use(protect);
router.use(authorize('admin'));

// Upload batch routes
router.post('/upload', upload.single('file'), uploadImportFile);
router.post('/:batchId/preview', previewImportFile);
router.post('/:batchId/validate', validateImportFile);
router.post('/:batchId/commit', commitImportFile);
router.post('/:batchId/rollback', rollbackImportBatch);

// Fetch batches info routes
router.get('/stats', getImportStats);
router.get('/templates/:format', getSampleTemplateFile);
router.get('/batches', getImportBatches);
router.get('/:batchId', getImportBatchById);
router.get('/:batchId/errors', getImportBatchErrors);
router.post('/:batchId/retry', retryFailedRows);

// Question review and state changes routes
router.patch('/questions/bulk-approve', bulkApproveQuestions);
router.patch('/questions/bulk-tag', bulkTagQuestions);
router.patch('/questions/bulk-publish', bulkPublishQuestions);

router.patch('/questions/:id/approve', approveQuestion);
router.patch('/questions/:id/reject', rejectQuestion);
router.patch('/questions/:id/publish', publishQuestion);

export default router;
