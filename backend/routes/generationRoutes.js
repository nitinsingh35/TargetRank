import express from 'express';
import {
  createGenerationJob,
  getGenerationBatches,
  getGenerationBatchById,
  deleteGenerationBatch,
} from '../controllers/generationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'mentor'));

router.post('/generate', createGenerationJob);
router.get('/batches', getGenerationBatches);
router.get('/batches/:id', getGenerationBatchById);
router.delete('/batches/:id', authorize('admin'), deleteGenerationBatch);

export default router;
