import mongoose from 'mongoose';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';
import ExamPracticeConfig from '../models/ExamPracticeConfig.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';

/**
 * Calculates the suggested/requested question count based on duration and exam configuration.
 */
export const calculateSuggestedQuestionCount = async (durationMinutes, examId) => {
  const mins = Number(durationMinutes) || 30;
  
  // Rule preset mappings
  const presetMinutes = [15, 30, 45, 60, 90, 120];
  const presetQuestions = [10, 20, 30, 40, 60, 80];
  
  const idx = presetMinutes.indexOf(mins);
  if (idx !== -1) {
    return presetQuestions[idx];
  }
  
  // Custom duration calculation
  let secondsPerQuestion = 90; // Default 90 seconds
  if (examId) {
    try {
      const config = await ExamPracticeConfig.findOne({ examId });
      if (config && config.defaultMinutesPerQuestion) {
        secondsPerQuestion = config.defaultMinutesPerQuestion * 60;
      }
    } catch (err) {
      console.error('Error fetching exam practice config:', err);
    }
  }
  
  const durationSeconds = mins * 60;
  return Math.max(1, Math.round(durationSeconds / secondsPerQuestion));
};

/**
 * Parses and normalizes input filters into Mongo ObjectIds.
 */
const parseIds = (ids) => {
  if (!ids) return [];
  if (Array.isArray(ids)) return ids.map(id => id.toString()).filter(Boolean);
  if (typeof ids === 'string') {
    return ids.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Fetch counts of verified questions matching selected criteria.
 */
export const getQuestionAvailability = async (filters) => {
  const {
    examId,
    phaseId,
    difficulty,
    language,
    sourceType,
    durationMinutes = 30,
    includeOriginalPractice = true,
    includePYQ = true
  } = filters;

  const subjectIds = parseIds(filters.subjectIds);
  const topicIds = parseIds(filters.topicIds);
  const subtopicIds = parseIds(filters.subtopicIds);

  // 1. Build base query (only approved, verified, and published questions)
  const baseQuery = {
    qualityStatus: 'approved',
    isVerified: true,
    isPublished: true
  };

  if (examId) baseQuery.examId = new mongoose.Types.ObjectId(examId);
  if (phaseId) baseQuery.phaseId = new mongoose.Types.ObjectId(phaseId);
  if (language) baseQuery.language = language;

  // Handle includeOriginalPractice and includePYQ toggles
  let sourceConditions = [];
  const pyqQuery = {
    $or: [
      { isPreviousYearQuestion: true },
      { sourceType: { $in: ['official_pyq', 'verified_previous_year'] } }
    ]
  };
  const originalQuery = {
    $and: [
      { isPreviousYearQuestion: { $ne: true } },
      { sourceType: { $nin: ['official_pyq', 'verified_previous_year'] } }
    ]
  };

  const pyqActive = includePYQ === true || includePYQ === 'true';
  const originalActive = includeOriginalPractice === true || includeOriginalPractice === 'true';

  if (pyqActive) {
    sourceConditions.push(pyqQuery);
  }
  if (originalActive) {
    sourceConditions.push(originalQuery);
  }

  if (sourceConditions.length === 1) {
    Object.assign(baseQuery, sourceConditions[0]);
  } else if (sourceConditions.length > 1) {
    baseQuery.$or = sourceConditions;
  } else {
    // Both false: matches nothing
    baseQuery._id = null;
  }

  // 2. Build exact eligible query (base + specific scope filters)
  const eligibleQuery = { ...baseQuery };

  if (subjectIds.length > 0) {
    eligibleQuery.subjectId = { $in: subjectIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  if (topicIds.length > 0) {
    eligibleQuery.topicId = { $in: topicIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  if (subtopicIds.length > 0) {
    eligibleQuery.subtopicId = { $in: subtopicIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  if (difficulty && difficulty !== 'mixed') {
    eligibleQuery.difficulty = difficulty;
  }
  if (sourceType) {
    eligibleQuery.sourceType = sourceType;
  }

  // Calculate total counts
  const [totalAvailableQuestions, totalEligibleQuestions] = await Promise.all([
    Question.countDocuments(baseQuery),
    Question.countDocuments(eligibleQuery)
  ]);

  // If there are zero questions, return early with safe defaults
  if (totalEligibleQuestions === 0) {
    const suggestedCount = await calculateSuggestedQuestionCount(durationMinutes, examId);
    return {
      totalAvailableQuestions,
      totalEligibleQuestions: 0,
      verifiedPYQCount: 0,
      originalPracticeCount: 0,
      currentAffairsCount: 0,
      availableBySubject: [],
      availableByTopic: [],
      availableBySubtopic: [],
      availableByDifficulty: { easy: 0, medium: 0, hard: 0 },
      availableBySourceType: {},
      suggestedQuestionCount: suggestedCount,
      requestedQuestionCount: suggestedCount,
      recommendedDurationMinutes: Number(durationMinutes) || 30,
      canStart: false,
      shortageMessage: 'No verified questions are currently available for your selected filters.',
      suggestions: generateSuggestions(0, suggestedCount, {
        subjectIds,
        topicIds,
        difficulty,
        includeOriginalPractice: originalActive,
        includePYQ: pyqActive
      })
    };
  }

  // 3. Execute aggregate for group counts
  const aggResult = await Question.aggregate([
    { $match: eligibleQuery },
    {
      $facet: {
        bySubject: [
          { $group: { _id: '$subjectId', count: { $sum: 1 } } }
        ],
        byTopic: [
          { $group: { _id: '$topicId', count: { $sum: 1 } } }
        ],
        bySubtopic: [
          { $group: { _id: '$subtopicId', count: { $sum: 1 } } }
        ],
        byDifficulty: [
          { $group: { _id: '$difficulty', count: { $sum: 1 } } }
        ],
        bySourceType: [
          { $group: { _id: '$sourceType', count: { $sum: 1 } } }
        ],
        pyqCount: [
          {
            $match: {
              $or: [
                { isPreviousYearQuestion: true },
                { sourceType: { $in: ['official_pyq', 'verified_previous_year'] } }
              ]
            }
          },
          { $count: 'count' }
        ],
        currentAffairsCount: [
          {
            $match: { sourceType: 'current_affairs' }
          },
          { $count: 'count' }
        ]
      }
    }
  ]);

  const facet = aggResult[0] || {};
  const verifiedPYQCount = facet.pyqCount?.[0]?.count || 0;
  const currentAffairsCount = facet.currentAffairsCount?.[0]?.count || 0;
  const originalPracticeCount = Math.max(0, totalEligibleQuestions - verifiedPYQCount);

  // Fetch subject, topic, and subtopic names
  const groupSubjectIds = (facet.bySubject || []).map(g => g._id).filter(Boolean);
  const groupTopicIds = (facet.byTopic || []).map(g => g._id).filter(Boolean);
  const groupSubtopicIds = (facet.bySubtopic || []).map(g => g._id).filter(Boolean);

  const [subjectDocs, topicDocs, subtopicDocs] = await Promise.all([
    Subject.find({ _id: { $in: groupSubjectIds } }).select('title').lean(),
    Topic.find({ _id: { $in: groupTopicIds } }).select('title').lean(),
    Subtopic.find({ _id: { $in: groupSubtopicIds } }).select('title').lean()
  ]);

  const subjectMap = new Map(subjectDocs.map(d => [d._id.toString(), d.title]));
  const topicMap = new Map(topicDocs.map(d => [d._id.toString(), d.title]));
  const subtopicMap = new Map(subtopicDocs.map(d => [d._id.toString(), d.title]));

  const availableBySubject = (facet.bySubject || []).map(g => ({
    subjectId: g._id ? g._id.toString() : null,
    subjectName: g._id ? (subjectMap.get(g._id.toString()) || 'Unknown') : 'No Subject',
    count: g.count
  })).filter(s => s.subjectId);

  const availableByTopic = (facet.byTopic || []).map(g => ({
    topicId: g._id ? g._id.toString() : null,
    topicName: g._id ? (topicMap.get(g._id.toString()) || 'Unknown') : 'No Topic',
    count: g.count
  })).filter(t => t.topicId);

  const availableBySubtopic = (facet.bySubtopic || []).map(g => ({
    subtopicId: g._id ? g._id.toString() : null,
    subtopicName: g._id ? (subtopicMap.get(g._id.toString()) || 'Unknown') : 'No Subtopic',
    count: g.count
  })).filter(st => st.subtopicId);

  const availableByDifficulty = { easy: 0, medium: 0, hard: 0 };
  (facet.byDifficulty || []).forEach(g => {
    if (g._id && availableByDifficulty[g._id] !== undefined) {
      availableByDifficulty[g._id] = g.count;
    }
  });

  const availableBySourceType = {};
  (facet.bySourceType || []).forEach(g => {
    if (g._id) {
      availableBySourceType[g._id] = g.count;
    }
  });

  const suggestedCount = await calculateSuggestedQuestionCount(durationMinutes, examId);
  const requestedCount = suggestedCount;

  // Decide starting conditions
  let canStart = false;
  let shortageMessage = null;

  if (totalEligibleQuestions >= requestedCount) {
    canStart = true;
    shortageMessage = null;
  } else {
    canStart = true;
    shortageMessage = `Only ${totalEligibleQuestions} verified questions are currently available for your selected filters. You can start with ${totalEligibleQuestions} questions or expand your filters.`;
  }

  const suggestions = generateSuggestions(totalEligibleQuestions, requestedCount, {
    subjectIds,
    topicIds,
    difficulty,
    includeOriginalPractice: originalActive,
    includePYQ: pyqActive
  });

  return {
    totalAvailableQuestions,
    totalEligibleQuestions,
    verifiedPYQCount,
    originalPracticeCount,
    currentAffairsCount,
    availableBySubject,
    availableByTopic,
    availableBySubtopic,
    availableByDifficulty,
    availableBySourceType,
    suggestedQuestionCount: suggestedCount,
    requestedQuestionCount: requestedCount,
    recommendedDurationMinutes: Number(durationMinutes) || 30,
    canStart,
    shortageMessage,
    suggestions
  };
};

/**
 * Generates recovery/expansion suggestions based on filters and question numbers.
 */
function generateSuggestions(eligibleCount, requestedCount, filters) {
  const { subjectIds, topicIds, difficulty, includeOriginalPractice, includePYQ } = filters;
  const suggestions = [];

  if (eligibleCount < requestedCount) {
    if (topicIds && topicIds.length > 0) {
      suggestions.push('Expand selected topics');
    }
    if (subjectIds && subjectIds.length > 0) {
      suggestions.push('Choose a broader subject filter');
    }
    if (difficulty && difficulty !== 'mixed') {
      if (difficulty !== 'medium') {
        suggestions.push('Include medium difficulty');
      }
      suggestions.push('Include all difficulty levels');
    }
    if (!includeOriginalPractice) {
      suggestions.push('Include original practice questions');
    }
    if (!includePYQ) {
      suggestions.push('Include verified PYQs');
    }
    suggestions.push('Reduce duration');
  }

  return suggestions;
}
