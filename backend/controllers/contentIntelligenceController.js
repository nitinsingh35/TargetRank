/**
 * contentIntelligenceController.js
 * Handles all Content Intelligence Layer API endpoints.
 */

import {
  computeSyllabusCoverage,
  computeContentHealth,
  detectMissingContent,
  buildSmartMock,
  generateRecommendations,
  computeAdminAnalytics,
} from '../services/contentIntelligenceService.js';

// ─────────────────────────────────────────────────────────────
// GET /api/content/intelligence/coverage
// Admin + Student (filtered)
// ─────────────────────────────────────────────────────────────
export const getCoverage = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const coverage = await computeSyllabusCoverage(examId || null);
    res.json({ success: true, coverage });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/content/intelligence/health
// Admin only
// ─────────────────────────────────────────────────────────────
export const getContentHealth = async (req, res, next) => {
  try {
    const health = await computeContentHealth();
    res.json({ success: true, health });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/content/intelligence/missing
// Admin only
// ─────────────────────────────────────────────────────────────
export const getMissingContent = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const result = await detectMissingContent(examId || null);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/content/intelligence/mock-builder
// Student
// ─────────────────────────────────────────────────────────────
export const buildMockTest = async (req, res, next) => {
  try {
    const {
      examId,
      phaseId,
      subjectIds,
      topicIds,
      difficulty,
      durationMinutes,
      language,
      questionCount,
    } = req.body;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required.' });
    }

    const result = await buildSmartMock({
      userId:         req.user._id,
      examId,
      phaseId,
      subjectIds:     subjectIds || [],
      topicIds:       topicIds   || [],
      difficulty:     difficulty || 'mixed',
      durationMinutes: Number(durationMinutes) || 90,
      language:       language || 'english',
      questionCount:  questionCount ? Number(questionCount) : null,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/content/intelligence/recommendations
// Student (scoped to their exam)
// ─────────────────────────────────────────────────────────────
export const getRecommendations = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const recommendations = await generateRecommendations(
      req.user._id,
      examId || null
    );
    res.json({ success: true, recommendations });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/content/intelligence/statistics
// Admin only
// ─────────────────────────────────────────────────────────────
export const getStatistics = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const stats = await computeAdminAnalytics(examId || null);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/content/intelligence/analytics/growth
// Admin only  (alias that just returns the growth data subset)
// ─────────────────────────────────────────────────────────────
export const getAnalyticsGrowth = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const stats = await computeAdminAnalytics(examId || null);
    res.json({
      success:       true,
      questionGrowth: stats.questionGrowth,
      importSummary:  stats.importSummary,
    });
  } catch (err) {
    next(err);
  }
};
