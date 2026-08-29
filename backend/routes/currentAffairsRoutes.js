import express from 'express';
import {
  getPacks,
  getPackDetails,
  startPractice,
  getPackCategoryCoverage,
  getGlobalCoverage,
  getMyHistory,
} from '../controllers/currentAffairsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce auth for all student current affairs routes
router.use(protect);

router.get('/packs', getPacks);
router.get('/coverage', getGlobalCoverage);
router.get('/my-history', getMyHistory);

router.route('/packs/:id')
  .get(getPackDetails);

router.post('/packs/:id/start-practice', startPractice);
router.get('/packs/:id/coverage', getPackCategoryCoverage);

export default router;
