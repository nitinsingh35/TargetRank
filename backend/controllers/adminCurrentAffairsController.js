import CurrentAffairsSource from '../models/CurrentAffairsSource.js';
import CurrentAffairsPack from '../models/CurrentAffairsPack.js';
import Question from '../models/Question.js';
import PracticeSession from '../models/PracticeSession.js';
import * as packService from '../services/currentAffairsPackService.js';

// =========================================================================
// ── SOURCE MODERATION APIS ───────────────────────────────────────────────
// =========================================================================

// 1. POST /api/admin/current-affairs/sources
export const createSource = async (req, res, next) => {
  try {
    const source = await CurrentAffairsSource.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'draft',
      isVerified: false
    });
    res.status(201).json({ success: true, source });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/admin/current-affairs/sources
export const getSources = async (req, res, next) => {
  try {
    const { month, year, sourceCategory, reliabilityLevel, status, language, search } = req.query;
    const filter = {};

    if (sourceCategory) filter.sourceCategory = sourceCategory;
    if (reliabilityLevel) filter.reliabilityLevel = reliabilityLevel;
    if (status) filter.status = status;
    if (language) filter.language = language;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { publisherName: { $regex: search, $options: 'i' } }
      ];
    }

    if (month || year) {
      // If filtering by month/year, match against publicationDate
      const queryYear = year ? Number(year) : new Date().getFullYear();
      let start, end;
      if (month) {
        const queryMonth = Number(month) - 1; // 0-indexed
        start = new Date(queryYear, queryMonth, 1);
        end = new Date(queryYear, queryMonth + 1, 0, 23, 59, 59, 999);
      } else {
        start = new Date(queryYear, 0, 1);
        end = new Date(queryYear, 11, 31, 23, 59, 59, 999);
      }
      filter.publicationDate = { $gte: start, $lte: end };
    }

    const sources = await CurrentAffairsSource.find(filter)
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(sources);
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/admin/current-affairs/sources/:id
export const getSourceById = async (req, res, next) => {
  try {
    const source = await CurrentAffairsSource.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name');
    if (!source) {
      return res.status(404).json({ message: 'Source not found.' });
    }
    res.status(200).json(source);
  } catch (error) {
    next(error);
  }
};

// 4. PUT /api/admin/current-affairs/sources/:id
export const updateSource = async (req, res, next) => {
  try {
    const source = await CurrentAffairsSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ message: 'Source not found.' });
    }

    // If source status is approved, block editing unless re-verified
    const updates = { ...req.body };
    if (source.status === 'approved') {
      updates.status = 'draft';
      updates.isVerified = false;
      updates.verifiedBy = null;
      updates.verifiedAt = null;
    }

    const updatedSource = await CurrentAffairsSource.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, source: updatedSource });
  } catch (error) {
    next(error);
  }
};

// 5. POST /api/admin/current-affairs/sources/:id/verify
export const verifySource = async (req, res, next) => {
  try {
    const source = await CurrentAffairsSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ message: 'Source not found.' });
    }

    source.isVerified = true;
    source.verifiedBy = req.user._id;
    source.verifiedAt = new Date();
    source.status = 'approved';

    await source.save();
    res.status(200).json({ success: true, message: 'Source verified and approved.', source });
  } catch (error) {
    next(error);
  }
};

// 6. POST /api/admin/current-affairs/sources/:id/archive
export const archiveSource = async (req, res, next) => {
  try {
    const source = await CurrentAffairsSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ message: 'Source not found.' });
    }

    source.status = 'archived';
    await source.save();
    res.status(200).json({ success: true, message: 'Source archived.', source });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// ── PACK MODERATION APIS ─────────────────────────────────────────────────
// =========================================================================

// 7. POST /api/admin/current-affairs/packs
export const createPack = async (req, res, next) => {
  try {
    const pack = await CurrentAffairsPack.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'draft',
      isPublished: false
    });
    res.status(201).json({ success: true, pack });
  } catch (error) {
    next(error);
  }
};

// 8. GET /api/admin/current-affairs/packs
export const getPacks = async (req, res, next) => {
  try {
    const { month, year, examId, phaseId, category, language, status } = req.query;
    const filter = {};

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (examId) filter.examIds = examId;
    if (phaseId) filter.phaseIds = phaseId;
    if (category) filter.categories = category;
    if (language) filter.language = language;
    if (status) filter.status = status;

    const packs = await CurrentAffairsPack.find(filter)
      .populate('examIds', 'title')
      .populate('phaseIds', 'title')
      .populate('createdBy', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.status(200).json(packs);
  } catch (error) {
    next(error);
  }
};

// 9. GET /api/admin/current-affairs/packs/:id
export const getPackById = async (req, res, next) => {
  try {
    const pack = await CurrentAffairsPack.findById(req.params.id)
      .populate('examIds', 'title')
      .populate('phaseIds', 'title')
      .populate('questionIds')
      .populate('sourceIds');
    if (!pack) {
      return res.status(404).json({ message: 'Pack not found.' });
    }
    res.status(200).json(pack);
  } catch (error) {
    next(error);
  }
};

// 10. PUT /api/admin/current-affairs/packs/:id
export const updatePack = async (req, res, next) => {
  try {
    const pack = await CurrentAffairsPack.findById(req.params.id);
    if (!pack) {
      return res.status(404).json({ message: 'Pack not found.' });
    }

    const updates = { ...req.body };
    if (pack.status === 'published') {
      // Revert publish parameters on change
      updates.status = 'draft';
      updates.isPublished = false;
    }

    const updated = await CurrentAffairsPack.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, pack: updated });
  } catch (error) {
    next(error);
  }
};

// 11. DELETE /api/admin/current-affairs/packs/:id
export const deletePack = async (req, res, next) => {
  try {
    const attempts = await PracticeSession.countDocuments({ currentAffairsPackId: req.params.id });
    if (attempts > 0) {
      // Has history, archive instead
      const pack = await CurrentAffairsPack.findByIdAndUpdate(
        req.params.id,
        { status: 'archived', isPublished: false },
        { new: true }
      );
      return res.status(200).json({ success: true, archived: true, message: 'Pack has attempt history. Archived instead of deleted.', pack });
    }

    await CurrentAffairsPack.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, archived: false, message: 'Pack deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// 12. POST /api/admin/current-affairs/packs/:id/validate
export const validatePack = async (req, res, next) => {
  try {
    const report = await packService.validateCurrentAffairsPack(req.params.id);
    res.status(200).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 13. POST /api/admin/current-affairs/packs/:id/publish
export const publishPack = async (req, res, next) => {
  try {
    const validation = await packService.validateCurrentAffairsPack(req.params.id);
    if (!validation.canPublish) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish pack. Validation issues found.',
        errors: validation.errors
      });
    }

    const pack = await CurrentAffairsPack.findById(req.params.id);
    pack.status = 'published';
    pack.isPublished = true;
    pack.publishedAt = new Date();
    pack.reviewedBy = req.user._id;
    pack.reviewedAt = new Date();
    pack.totalQuestions = pack.questionIds.length;

    await pack.save();

    // Link packId to linked questions as well
    await Question.updateMany(
      { _id: { $in: pack.questionIds } },
      { $set: { currentAffairsPackId: pack._id } }
    );

    res.status(200).json({ success: true, message: 'Pack published successfully.', pack });
  } catch (error) {
    next(error);
  }
};

// 14. POST /api/admin/current-affairs/packs/:id/archive
export const archivePack = async (req, res, next) => {
  try {
    const pack = await CurrentAffairsPack.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', isPublished: false },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Pack archived successfully.', pack });
  } catch (error) {
    next(error);
  }
};

// 15. POST /api/admin/current-affairs/packs/:id/duplicate
export const duplicatePack = async (req, res, next) => {
  try {
    const pack = await CurrentAffairsPack.findById(req.params.id);
    if (!pack) {
      return res.status(404).json({ message: 'Pack not found.' });
    }

    const duplicate = await CurrentAffairsPack.create({
      title: `${pack.title} (Copy)`,
      description: pack.description,
      month: pack.month,
      year: pack.year,
      language: pack.language,
      examIds: pack.examIds,
      phaseIds: pack.phaseIds,
      categories: pack.categories,
      sourceIds: pack.sourceIds,
      questionIds: pack.questionIds,
      totalQuestions: pack.totalQuestions,
      estimatedPracticeMinutes: pack.estimatedPracticeMinutes,
      difficultyMix: pack.difficultyMix,
      status: 'draft',
      isPublished: false,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, pack: duplicate });
  } catch (error) {
    next(error);
  }
};

// 16. GET /api/admin/current-affairs/packs/:id/analytics
export const getPackAnalytics = async (req, res, next) => {
  try {
    const sessions = await PracticeSession.find({
      currentAffairsPackId: req.params.id
    }).lean();

    if (sessions.length === 0) {
      return res.status(200).json({
        totalAttempts: 0,
        completionRate: 0,
        avgScore: 0,
        avgAccuracy: 0,
        avgTimeTaken: 0,
        categoryPerformance: [],
        difficultCategories: []
      });
    }

    const completed = sessions.filter(s => s.status === 'submitted');
    const totalCount = sessions.length;
    const completedCount = completed.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const scores = completed.map(s => s.score || 0);
    const accuracies = completed.map(s => s.accuracy || 0);
    const times = completed.map(s => s.timeTakenSeconds || 0);

    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const avgAccuracy = accuracies.length ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : 0;
    const avgTimeTaken = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 60) : 0;

    // Calculate category accuracy
    const catStats = {};
    for (const s of completed) {
      for (const t of (s.topicPerformance || [])) {
        // Find subject/category of topic using related pack context or group by category if logged
        // Here we compile category Performance:
        const cat = t.topicName || 'General';
        if (!catStats[cat]) {
          catStats[cat] = { category: cat, correct: 0, total: 0 };
        }
        catStats[cat].correct += t.correct || 0;
        catStats[cat].total += t.total || 0;
      }
    }

    const categoryPerformance = Object.values(catStats).map(c => ({
      category: c.category,
      accuracy: c.total > 0 ? (c.correct / c.total) * 100 : 0,
      totalQuestions: c.total
    }));

    // Find difficult categories (accuracy < 50%)
    const difficultCategories = categoryPerformance
      .filter(c => c.accuracy < 50)
      .sort((a, b) => a.accuracy - b.accuracy);

    res.status(200).json({
      totalAttempts: totalCount,
      completionRate: Number(completionRate.toFixed(1)),
      avgScore: Number(avgScore.toFixed(1)),
      avgAccuracy: Number(avgAccuracy.toFixed(1)),
      avgTimeTaken,
      categoryPerformance,
      difficultCategories
    });
  } catch (error) {
    next(error);
  }
};
