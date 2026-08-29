/**
 * contentIntelligenceRoutes.js
 * Registers all Content Intelligence Layer API endpoints.
 *
 * Mount at: /api/content/intelligence
 */

import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getCoverage,
  getContentHealth,
  getMissingContent,
  buildMockTest,
  getRecommendations,
  getStatistics,
  getAnalyticsGrowth,
} from '../controllers/contentIntelligenceController.js';

const router = express.Router();

// ── Admin-only routes ──────────────────────────────────────
router.get('/health',            protect, authorize('admin'), getContentHealth);
router.get('/missing',           protect, authorize('admin'), getMissingContent);
router.get('/statistics',        protect, authorize('admin'), getStatistics);
router.get('/analytics/growth',  protect, authorize('admin'), getAnalyticsGrowth);

// ── Shared (admin + student) ───────────────────────────────
router.get('/coverage',          protect, getCoverage);

// ── Student routes ─────────────────────────────────────────
router.get('/recommendations',   protect, getRecommendations);
router.post('/mock-builder',     protect, buildMockTest);

export default router;
