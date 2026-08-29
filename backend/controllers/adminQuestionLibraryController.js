import mongoose from 'mongoose';
import Question from '../models/Question.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';
import Exam from '../models/Exam.js';

// Helper to parse comma-separated values or arrays into standard query lists
const parseFilterArray = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    return val.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [val];
};

// @desc    Get counts for library dashboard cards
// @route   GET /api/admin/questions/library/stats
// @access  Private/Admin
export const getLibraryStats = async (req, res, next) => {
  try {
    const totalCount = await Question.countDocuments({});
    const publishedCount = await Question.countDocuments({ qualityStatus: 'published' });
    const draftCount = await Question.countDocuments({ qualityStatus: 'draft' });
    
    // PYQs check: either field isPreviousYearQuestion is true OR sourceType is previous_year / official_pyq / verified_previous_year
    const pyqCount = await Question.countDocuments({
      $or: [
        { isPreviousYearQuestion: true },
        { sourceType: { $in: ['official_pyq', 'previous_year', 'verified_previous_year'] } }
      ]
    });

    const importantCount = await Question.countDocuments({
      importanceLevel: { $in: ['important', 'very_important', 'must_do'] }
    });

    const currentAffairsCount = await Question.countDocuments({ sourceType: 'current_affairs' });
    
    const bookBasedCount = await Question.countDocuments({
      sourceType: { $in: ['book_based', 'book_based_concept_practice'] }
    });

    const pendingReviewCount = await Question.countDocuments({ qualityStatus: 'pending_review' });
    const rejectedCount = await Question.countDocuments({ qualityStatus: 'rejected' });

    // Aggregation for Duplicate Questions count
    const dupGroups = await Question.aggregate([
      { $match: { duplicateHash: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$duplicateHash', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    const duplicateCount = dupGroups.reduce((acc, g) => acc + g.count, 0);

    res.status(200).json({
      total: totalCount,
      published: publishedCount,
      draft: draftCount,
      pyqs: pyqCount,
      important: importantCount,
      currentAffairs: currentAffairsCount,
      bookBased: bookBasedCount,
      pendingReview: pendingReviewCount,
      duplicate: duplicateCount,
      rejected: rejectedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List questions with advanced multi-select filters and pagination
// @route   GET /api/admin/questions/library/list
// @access  Private/Admin
export const listLibraryQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      examId,
      phaseId,
      subjectId,
      topicId,
      subtopicId,
      language,
      difficulty,
      questionType,
      sourceType,
      qualityStatus,
      importanceLevel,
      sourceYear,
      isPYQ,
      cardFilter
    } = req.query;

    const query = {};

    // 1. Process Multi-select fields
    const exams = parseFilterArray(examId);
    if (exams) query.examId = { $in: exams.map(id => new mongoose.Types.ObjectId(id)) };

    const phases = parseFilterArray(phaseId);
    if (phases) query.phaseId = { $in: phases.map(id => new mongoose.Types.ObjectId(id)) };

    const subjects = parseFilterArray(subjectId);
    if (subjects) query.subjectId = { $in: subjects.map(id => new mongoose.Types.ObjectId(id)) };

    const topics = parseFilterArray(topicId);
    if (topics) query.topicId = { $in: topics.map(id => new mongoose.Types.ObjectId(id)) };

    const subtopics = parseFilterArray(subtopicId);
    if (subtopics) query.subtopicId = { $in: subtopics.map(id => new mongoose.Types.ObjectId(id)) };

    const langs = parseFilterArray(language);
    if (langs) query.language = { $in: langs };

    const diffs = parseFilterArray(difficulty);
    if (diffs) query.difficulty = { $in: diffs };

    const qtypes = parseFilterArray(questionType);
    if (qtypes) query.questionType = { $in: qtypes };

    const stypes = parseFilterArray(sourceType);
    if (stypes) query.sourceType = { $in: stypes };

    const statuses = parseFilterArray(qualityStatus);
    if (statuses) query.qualityStatus = { $in: statuses };

    const importances = parseFilterArray(importanceLevel);
    if (importances) query.importanceLevel = { $in: importances };

    const years = parseFilterArray(sourceYear);
    if (years) query.sourceYear = { $in: years.map(Number) };

    if (isPYQ === 'true') {
      query.$or = [
        { isPreviousYearQuestion: true },
        { sourceType: { $in: ['official_pyq', 'previous_year', 'verified_previous_year'] } }
      ];
    }

    // 2. Clickable Card Quick Filters
    if (cardFilter) {
      if (cardFilter === 'published') query.qualityStatus = 'published';
      else if (cardFilter === 'draft') query.qualityStatus = 'draft';
      else if (cardFilter === 'pending_review') query.qualityStatus = 'pending_review';
      else if (cardFilter === 'rejected') query.qualityStatus = 'rejected';
      else if (cardFilter === 'pyqs') {
        query.$or = [
          { isPreviousYearQuestion: true },
          { sourceType: { $in: ['official_pyq', 'previous_year', 'verified_previous_year'] } }
        ];
      } else if (cardFilter === 'important') {
        query.importanceLevel = { $in: ['important', 'very_important', 'must_do'] };
      } else if (cardFilter === 'current_affairs') {
        query.sourceType = 'current_affairs';
      } else if (cardFilter === 'book_based') {
        query.sourceType = { $in: ['book_based', 'book_based_concept_practice'] };
      } else if (cardFilter === 'duplicate') {
        // Find hashes first
        const dupGroups = await Question.aggregate([
          { $match: { duplicateHash: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$duplicateHash', count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } }
        ]);
        const hashes = dupGroups.map(g => g._id);
        query.duplicateHash = { $in: hashes };
      }
    }

    // 3. Process Search Keyword
    if (search) {
      const cleanSearch = search.trim();
      query.$or = [
        { questionText: { $regex: cleanSearch, $options: 'i' } },
        { explanation: { $regex: cleanSearch, $options: 'i' } },
        { tags: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    // 4. Execute pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const order = sortOrder === 'asc' ? 1 : -1;

    const questions = await Question.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limitNum)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .populate('subtopicId', 'title')
      .lean();

    const total = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      count: questions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      questions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform bulk updates (publish, archive, delete, move subject/topic)
// @route   POST /api/admin/questions/library/bulk-update
// @access  Private/Admin
export const bulkOperations = async (req, res, next) => {
  try {
    const { questionIds, action, targetId } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: 'No question IDs provided' });
    }

    const objectIds = questionIds.map(id => new mongoose.Types.ObjectId(id));

    let updateResult;

    if (action === 'publish') {
      updateResult = await Question.updateMany(
        { _id: { $in: objectIds } },
        { $set: { qualityStatus: 'published', isPublished: true } }
      );
    } else if (action === 'archive') {
      updateResult = await Question.updateMany(
        { _id: { $in: objectIds } },
        { $set: { qualityStatus: 'archived', isArchived: true, isPublished: false, archivedAt: new Date(), archivedBy: req.user._id } }
      );
    } else if (action === 'delete') {
      updateResult = await Question.deleteMany({ _id: { $in: objectIds } });
    } else if (action === 'change_subject') {
      if (!targetId) return res.status(400).json({ message: 'Target Subject ID is required' });
      const sub = await Subject.findById(targetId);
      if (!sub) return res.status(404).json({ message: 'Target Subject not found' });
      
      updateResult = await Question.updateMany(
        { _id: { $in: objectIds } },
        { $set: { subjectId: sub._id, examId: sub.examId, phaseId: sub.phaseId } }
      );
    } else if (action === 'change_topic') {
      if (!targetId) return res.status(400).json({ message: 'Target Topic ID is required' });
      const top = await Topic.findById(targetId);
      if (!top) return res.status(404).json({ message: 'Target Topic not found' });
      
      updateResult = await Question.updateMany(
        { _id: { $in: objectIds } },
        { $set: { topicId: top._id, subjectId: top.subjectId, examId: top.examId, phaseId: top.phaseId } }
      );
    } else {
      return res.status(400).json({ message: 'Invalid bulk action' });
    }

    res.status(200).json({
      success: true,
      message: `Bulk operation '${action}' completed successfully`,
      result: updateResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve dynamic analytical charts data
// @route   GET /api/admin/questions/library/analytics
// @access  Private/Admin
export const getLibraryAnalytics = async (req, res, next) => {
  try {
    // 1. Difficulty distribution
    const difficultyDist = await Question.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    // 2. Language distribution
    const languageDist = await Question.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]);

    // 3. Exam distribution
    const examDist = await Question.aggregate([
      { $group: { _id: '$examId', count: { $sum: 1 } } },
      { $lookup: { from: 'exams', localField: '_id', foreignField: '_id', as: 'examInfo' } },
      { $unwind: { path: '$examInfo', preserveNullAndEmptyArrays: true } },
      { $project: { title: '$examInfo.title', count: 1 } }
    ]);

    // 4. Topic-wise count
    const topicDist = await Question.aggregate([
      { $group: { _id: '$topicId', count: { $sum: 1 } } },
      { $lookup: { from: 'topics', localField: '_id', foreignField: '_id', as: 'topicInfo' } },
      { $unwind: { path: '$topicInfo', preserveNullAndEmptyArrays: true } },
      { $project: { title: '$topicInfo.title', count: 1 } }
    ]);

    // 5. Shortage Report: Topics with less than 5 questions
    const allTopics = await Topic.find({ active: true, isPublished: true }).select('title examId subjectId').lean();
    const countMap = {};
    const questionCountsByTopic = await Question.aggregate([
      { $group: { _id: '$topicId', count: { $sum: 1 } } }
    ]);
    questionCountsByTopic.forEach(item => {
      if (item._id) countMap[item._id.toString()] = item.count;
    });

    const shortageList = [];
    for (const t of allTopics) {
      const qCount = countMap[t._id.toString()] || 0;
      if (qCount < 5) {
        const examName = await Exam.findById(t.examId).select('title').lean();
        shortageList.push({
          topicId: t._id,
          topicTitle: t.title,
          examTitle: examName?.title || 'Unknown',
          count: qCount
        });
      }
    }
    // Sort shortage list with lowest count first
    shortageList.sort((a, b) => a.count - b.count);

    // 6. Duplicate Detection List (groups with same hash)
    const duplicateGroups = await Question.aggregate([
      { $match: { duplicateHash: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$duplicateHash', questions: { $push: { _id: '$_id', questionText: '$questionText', sourceType: '$sourceType', sourceYear: '$sourceYear' } }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 20 }
    ]);

    res.status(200).json({
      success: true,
      difficultyDistribution: difficultyDist,
      languageDistribution: languageDist,
      examDistribution: examDist,
      topicDistribution: topicDist,
      shortageTopics: shortageList.slice(0, 30),
      duplicates: duplicateGroups
    });
  } catch (error) {
    next(error);
  }
};
