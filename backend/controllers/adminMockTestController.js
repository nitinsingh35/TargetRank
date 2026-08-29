import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Question from '../models/Question.js';
import { mockExamPatterns } from '../config/mockExamPatterns.js';
import { generateMockQuestions } from '../services/mockTestGeneratorService.js';
import mongoose from 'mongoose';

// Helper to slugify title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') + '-' + Math.floor(Math.random() * 10000);
};

// 1. GET /api/admin/mock-tests/templates
export const getMockTestTemplates = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      templates: mockExamPatterns,
    });
  } catch (error) {
    next(error);
  }
};

// 2. POST /api/admin/mock-tests
export const createMockTest = async (req, res, next) => {
  try {
    const {
      title,
      description,
      examId,
      phaseId,
      category,
      instructions,
      instructionsHindi,
      language,
      durationMinutes,
      totalQuestions,
      totalMarks,
      negativeMarkingEnabled,
      defaultNegativeMarks,
      passingMarks,
      attemptLimit,
      availableFrom,
      availableUntil,
      isPremium,
      price,
      questionSelectionMode,
      fixedQuestionIds = [],
      selectionRules = {},
      examPattern = {},
      tags = [],
    } = req.body;

    if (!title || !examId || !phaseId) {
      return res.status(400).json({ message: 'Title, Exam ID and Phase ID are required.' });
    }

    const slug = slugify(title);

    const mockTest = await MockTest.create({
      title,
      slug,
      description,
      examId,
      phaseId,
      category,
      instructions,
      instructionsHindi,
      language,
      durationMinutes,
      totalQuestions,
      totalMarks,
      negativeMarkingEnabled,
      defaultNegativeMarks,
      passingMarks,
      attemptLimit,
      availableFrom,
      availableUntil,
      isPremium,
      price,
      createdBy: req.user._id,
      questionSelectionMode,
      fixedQuestionIds,
      selectionRules,
      examPattern,
      tags,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      message: 'Mock Test draft created successfully.',
      mockTest,
    });
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/admin/mock-tests
export const getMockTests = async (req, res, next) => {
  try {
    const { examId, phaseId, category, status, language, isPremium } = req.query;
    const query = {};

    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    if (category) query.category = category;
    if (status) query.status = status;
    if (language) query.language = language;
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';

    const mockTests = await MockTest.find(query)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .sort('-createdAt');

    // Aggregate attempts count and check for question shortage for each test
    const testsWithAttemptCount = await Promise.all(
      mockTests.map(async (test) => {
        const attemptCount = await MockTestAttempt.countDocuments({ mockTestId: test._id });
        
        let hasShortage = false;
        let shortageMessage = '';
        try {
          // Dry-run generateMockQuestions with a null userId
          const dryRun = await generateMockQuestions(test, null);
          hasShortage = !dryRun.canStart;
          if (hasShortage) {
            const overall = dryRun.shortageDetails?.overall;
            if (overall) {
              shortageMessage = overall.message || `Shortage of ${overall.shortage} questions.`;
            } else {
              const secKeys = Object.keys(dryRun.shortageDetails);
              shortageMessage = secKeys.map(k => dryRun.shortageDetails[k].message).join(' | ');
            }
          }
        } catch (e) {
          hasShortage = true;
          shortageMessage = e.message;
        }

        return {
          ...test.toObject(),
          attemptsCount: attemptCount,
          hasShortage,
          shortageMessage,
        };
      })
    );

    res.status(200).json({
      success: true,
      mockTests: testsWithAttemptCount,
    });
  } catch (error) {
    next(error);
  }
};

// 4. GET /api/admin/mock-tests/:id
export const getMockTestDetails = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id)
      .populate('examId', 'title')
      .populate('phaseId', 'title');

    if (!mockTest) {
      return res.status(404).json({ message: 'Mock Test not found.' });
    }

    res.status(200).json({
      success: true,
      mockTest,
    });
  } catch (error) {
    next(error);
  }
};

// 5. PUT /api/admin/mock-tests/:id
export const updateMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock Test not found.' });
    }

    if (mockTest.status === 'published' && req.body.questionSelectionMode) {
      return res.status(400).json({ message: 'Cannot edit selection mode of a published test.' });
    }

    const updates = req.body;
    if (updates.title && updates.title !== mockTest.title) {
      updates.slug = slugify(updates.title);
    }

    const updatedTest = await MockTest.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Mock Test updated successfully.',
      mockTest: updatedTest,
    });
  } catch (error) {
    next(error);
  }
};

// 6. DELETE /api/admin/mock-tests/:id
export const deleteMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock Test not found.' });
    }

    const attemptsCount = await MockTestAttempt.countDocuments({ mockTestId: mockTest._id });

    if (attemptsCount > 0) {
      // Archive instead of deleting if attempts exist
      mockTest.status = 'archived';
      mockTest.isPublished = false;
      await mockTest.save();
      return res.status(200).json({
        success: true,
        message: 'Mock test contains aspirant attempt records. It has been archived and unpublished instead of permanently deleted.',
        archived: true,
      });
    }

    await MockTest.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Mock Test deleted successfully.',
      deleted: true,
    });
  } catch (error) {
    next(error);
  }
};

// 7. POST /api/admin/mock-tests/:id/preview-availability
export const previewAvailability = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock Test not found.' });
    }

    const sections = mockTest.examPattern.sections || [];
    const language = mockTest.language;
    const includePYQ = mockTest.selectionRules?.includePYQ !== false;
    const includeOriginalPractice = mockTest.selectionRules?.includeOriginalPractice !== false;

    const sectionsPreview = await Promise.all(
      sections.map(async (sec) => {
        const query = {
          qualityStatus: 'approved',
          isVerified: true,
          isPublished: true,
          examId: mockTest.examId,
          phaseId: mockTest.phaseId,
        };

        if (sec.subjectIds && sec.subjectIds.length > 0) {
          query.subjectId = { $in: sec.subjectIds };
        }
        if (sec.topicIds && sec.topicIds.length > 0) {
          query.topicId = { $in: sec.topicIds };
        }
        if (language && language !== 'bilingual') {
          query.language = language;
        }

        const sourceConditions = [];
        if (includePYQ) {
          sourceConditions.push({
            $or: [
              { isPreviousYearQuestion: true },
              { sourceType: { $in: ['official_pyq', 'verified_previous_year'] } }
            ]
          });
        }
        if (includeOriginalPractice) {
          sourceConditions.push({
            $and: [
              { isPreviousYearQuestion: { $ne: true } },
              { sourceType: { $nin: ['official_pyq', 'verified_previous_year'] } }
            ]
          });
        }

        if (sourceConditions.length === 1) {
          Object.assign(query, sourceConditions[0]);
        } else if (sourceConditions.length > 1) {
          query.$or = sourceConditions;
        }

        const availableCount = await Question.countDocuments(query);
        const shortage = Math.max(0, sec.questionCount - availableCount);

        return {
          sectionId: sec._id,
          sectionName: sec.name,
          required: sec.questionCount,
          available: availableCount,
          shortage,
          isSufficient: shortage === 0,
        };
      })
    );

    const overallShortage = sectionsPreview.reduce((acc, s) => acc + s.shortage, 0);

    res.status(200).json({
      success: true,
      sectionsPreview,
      overallShortage,
      canPublish: overallShortage === 0,
    });
  } catch (error) {
    next(error);
  }
};

// 8. POST /api/admin/mock-tests/:id/publish
export const publishMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock Test not found.' });
    }

    const { allowAvailableCountMode = false } = req.body;

    // Validate overall contents
    if (!mockTest.title || !mockTest.examId || !mockTest.phaseId || !mockTest.durationMinutes) {
      return res.status(400).json({ message: 'Mock test details are incomplete (Title, Exam, Phase, and Duration are required).' });
    }

    if (!mockTest.examPattern.sections || mockTest.examPattern.sections.length === 0) {
      return res.status(400).json({ message: 'Test pattern must contain at least one section.' });
    }

    // Availability validation check
    if (mockTest.questionSelectionMode === 'dynamic') {
      const sections = mockTest.examPattern.sections || [];
      const language = mockTest.language;
      const includePYQ = mockTest.selectionRules?.includePYQ !== false;
      const includeOriginalPractice = mockTest.selectionRules?.includeOriginalPractice !== false;

      let overallShortage = 0;

      for (const sec of sections) {
        const query = {
          qualityStatus: 'approved',
          isVerified: true,
          isPublished: true,
          examId: mockTest.examId,
          phaseId: mockTest.phaseId,
        };

        if (sec.subjectIds && sec.subjectIds.length > 0) query.subjectId = { $in: sec.subjectIds };
        if (sec.topicIds && sec.topicIds.length > 0) query.topicId = { $in: sec.topicIds };
        if (language && language !== 'bilingual') query.language = language;

        const sourceConditions = [];
        if (includePYQ) {
          sourceConditions.push({
            $or: [
              { isPreviousYearQuestion: true },
              { sourceType: { $in: ['official_pyq', 'verified_previous_year'] } }
            ]
          });
        }
        if (includeOriginalPractice) {
          sourceConditions.push({
            $and: [
              { isPreviousYearQuestion: { $ne: true } },
              { sourceType: { $nin: ['official_pyq', 'verified_previous_year'] } }
            ]
          });
        }

        if (sourceConditions.length === 1) {
          Object.assign(query, sourceConditions[0]);
        } else if (sourceConditions.length > 1) {
          query.$or = sourceConditions;
        }

        const count = await Question.countDocuments(query);
        if (count < sec.questionCount) {
          overallShortage += (sec.questionCount - count);
        }
      }

      if (overallShortage > 0 && !allowAvailableCountMode) {
        return res.status(400).json({
          success: false,
          shortage: true,
          message: `Cannot publish: question bank has shortage of ${overallShortage} matching questions. Please expand your pool or allow Available-Count Mode.`
        });
      }
    } else {
      // Fixed Mode validation
      if (!mockTest.fixedQuestionIds || mockTest.fixedQuestionIds.length === 0) {
        return res.status(400).json({ message: 'Fixed question list cannot be empty for Fixed-Mode tests.' });
      }

      const validCount = await Question.countDocuments({
        _id: { $in: mockTest.fixedQuestionIds },
        qualityStatus: 'approved',
        isVerified: true,
        isPublished: true,
      });

      if (validCount < mockTest.fixedQuestionIds.length) {
        return res.status(400).json({ message: 'Some fixed questions are invalid, deleted or unpublished.' });
      }
    }

    mockTest.status = 'published';
    mockTest.isPublished = true;
    await mockTest.save();

    res.status(200).json({
      success: true,
      message: 'Mock Test published successfully.',
      mockTest,
    });
  } catch (error) {
    next(error);
  }
};

// 9. POST /api/admin/mock-tests/:id/archive
export const archiveMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock Test not found.' });
    }

    mockTest.status = 'archived';
    mockTest.isPublished = false;
    await mockTest.save();

    res.status(200).json({
      success: true,
      message: 'Mock Test archived successfully.',
      mockTest,
    });
  } catch (error) {
    next(error);
  }
};

// 10. POST /api/admin/mock-tests/:id/duplicate
export const duplicateMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock Test not found.' });
    }

    const testObj = mockTest.toObject();
    delete testObj._id;
    delete testObj.createdAt;
    delete testObj.updatedAt;

    testObj.title = `${testObj.title} (Duplicate)`;
    testObj.slug = slugify(testObj.title);
    testObj.status = 'draft';
    testObj.isPublished = false;
    testObj.createdBy = req.user._id;

    const duplicatedTest = await MockTest.create(testObj);

    res.status(201).json({
      success: true,
      message: 'Mock Test duplicated successfully as draft.',
      mockTest: duplicatedTest,
    });
  } catch (error) {
    next(error);
  }
};

// 11. GET /api/admin/mock-tests/:id/analytics
export const getMockTestAnalytics = async (req, res, next) => {
  try {
    const mockTestId = new mongoose.Types.ObjectId(req.params.id);

    const attempts = await MockTestAttempt.find({ mockTestId, status: 'submitted' }).lean();

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          totalAttempts: 0,
          completionRate: 0,
          averageScore: 0,
          averageAccuracy: 0,
          averageTimeSeconds: 0,
          weakTopics: [],
          bookmarkedQuestions: [],
        }
      });
    }

    const totalCreatedAttempts = await MockTestAttempt.countDocuments({ mockTestId });
    const submittedAttemptsCount = attempts.length;
    const completionRate = Number(((submittedAttemptsCount / totalCreatedAttempts) * 100).toFixed(2));

    const totalScore = attempts.reduce((acc, att) => acc + (att.score || 0), 0);
    const totalAccuracy = attempts.reduce((acc, att) => acc + (att.accuracy || 0), 0);
    const totalTime = attempts.reduce((acc, att) => acc + (att.timeTakenSeconds || 0), 0);

    const averageScore = Number((totalScore / submittedAttemptsCount).toFixed(2));
    const averageAccuracy = Number((totalAccuracy / submittedAttemptsCount).toFixed(2));
    const averageTimeSeconds = Number((totalTime / submittedAttemptsCount).toFixed(2));

    // Aggregate topic performance to find most incorrect/weak topics
    const topicMisses = {};
    attempts.forEach(att => {
      if (att.topicPerformance && Array.isArray(att.topicPerformance)) {
        att.topicPerformance.forEach(top => {
          if (top.accuracy < 50) {
            topicMisses[top.topicName] = (topicMisses[top.topicName] || 0) + 1;
          }
        });
      }
    });

    const weakTopics = Object.entries(topicMisses)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most bookmarked questions
    const bookmarkCounts = {};
    attempts.forEach(att => {
      att.questions.forEach(q => {
        if (q.isBookmarked) {
          bookmarkCounts[q.questionId.toString()] = (bookmarkCounts[q.questionId.toString()] || 0) + 1;
        }
      });
    });

    const bookmarkedIds = Object.keys(bookmarkCounts).slice(0, 5);
    const bookmarkedQuestionsList = await Question.find({ _id: { $in: bookmarkedIds } })
      .select('questionText subjectId topicId')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();

    const bookmarkedQuestions = bookmarkedQuestionsList.map(q => ({
      questionId: q._id,
      questionText: q.questionText,
      subject: q.subjectId?.title || 'General Studies',
      topic: q.topicId?.title || 'General Concept',
      bookmarksCount: bookmarkCounts[q._id.toString()] || 0,
    })).sort((a, b) => b.bookmarksCount - a.bookmarksCount);

    res.status(200).json({
      success: true,
      analytics: {
        totalAttempts: totalCreatedAttempts,
        completionRate,
        averageScore,
        averageAccuracy,
        averageTimeSeconds,
        weakTopics,
        bookmarkedQuestions,
      }
    });
  } catch (error) {
    next(error);
  }
};
