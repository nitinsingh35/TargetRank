import express from 'express';
import {
  createSource,
  getSources,
  getSourceById,
  updateSource,
  verifySource,
  archiveSource,
  createPack,
  getPacks,
  getPackById,
  updatePack,
  deletePack,
  validatePack,
  publishPack,
  archivePack,
  duplicatePack,
  getPackAnalytics,
} from '../controllers/adminCurrentAffairsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only middleware
router.use(protect);
router.use(authorize('admin'));

// Sources
router.route('/sources')
  .post(createSource)
  .get(getSources);

router.route('/sources/:id')
  .get(getSourceById)
  .put(updateSource);

router.post('/sources/:id/verify', verifySource);
router.post('/sources/:id/archive', archiveSource);

// Packs
router.route('/packs')
  .post(createPack)
  .get(getPacks);

router.route('/packs/:id')
  .get(getPackById)
  .put(updatePack)
  .delete(deletePack);

router.post('/packs/:id/validate', validatePack);
router.post('/packs/:id/publish', publishPack);
router.post('/packs/:id/archive', archivePack);
router.post('/packs/:id/duplicate', duplicatePack);
router.get('/packs/:id/analytics', getPackAnalytics);

export default router;
