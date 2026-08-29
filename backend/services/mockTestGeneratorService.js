import mongoose from 'mongoose';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Question from '../models/Question.js';
import RevisionItem from '../models/RevisionItem.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

/**
 * Normalizes input list into standard ObjectIds or strings.
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
 * Fisher-Yates shuffle helper
 */
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * 1. generateMockQuestions(mockTest, userId)
 */
export async function generateMockQuestions(mockTest, userId) {
  try {
    const {
      examId,
      phaseId,
      language,
      questionSelectionMode,
      fixedQuestionIds = [],
      examPattern = {},
      selectionRules = {},
    } = mockTest;

    const sections = examPattern.sections || [];
    const includePYQ = selectionRules.includePYQ !== false;
    const includeOriginalPractice = selectionRules.includeOriginalPractice !== false;
    const includeCurrentAffairs = selectionRules.includeCurrentAffairs !== false;
    const excludeRecentAttemptedDays = selectionRules.excludeRecentAttemptedDays || 0;

    // ── FIXED SELECTION MODE ──
    if (questionSelectionMode === 'fixed') {
      const questionsList = await Question.find({
        _id: { $in: fixedQuestionIds },
        qualityStatus: 'approved',
        isVerified: true,
        isPublished: true,
        isArchived: { $ne: true },
      }).lean();

      // Ensure they match mock sections. If sections aren't defined or fixed has no sectionId,
      // we map them to the first section or distribute them based on subjectId/topicId mapping.
      const questionsWithSections = [];
      const sectionMapBySubject = new Map();
      const sectionMapByTopic = new Map();
      
      sections.forEach(sec => {
        const subIds = parseIds(sec.subjectIds);
        const topIds = parseIds(sec.topicIds);
        subIds.forEach(sub => sectionMapBySubject.set(sub, sec._id.toString()));
        topIds.forEach(top => sectionMapByTopic.set(top, sec._id.toString()));
      });

      const defaultSectionId = sections[0]?._id?.toString() || 'default_sec';

      questionsList.forEach((q, idx) => {
        let secId = null;
        if (q.topicId && sectionMapByTopic.has(q.topicId.toString())) {
          secId = sectionMapByTopic.get(q.topicId.toString());
        } else if (q.subjectId && sectionMapBySubject.has(q.subjectId.toString())) {
          secId = sectionMapBySubject.get(q.subjectId.toString());
        } else {
          secId = defaultSectionId;
        }

        questionsWithSections.push({
          ...q,
          sectionId: secId,
          questionOrder: idx + 1,
        });
      });

      const selectedCount = questionsWithSections.length;
      const requestedCount = fixedQuestionIds.length;
      
      const shortageDetails = {};
      if (selectedCount < requestedCount) {
        shortageDetails['overall'] = {
          requested: requestedCount,
          available: selectedCount,
          shortage: requestedCount - selectedCount,
          message: 'Some fixed questions are not approved, verified, or published.'
        };
      }

      // Generate Distributions for selectionSummary
      const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
      const sourceDistribution = {};
      const subjectDistribution = {};
      const topicDistribution = {};

      // Gather names
      const subIds = questionsWithSections.map(q => q.subjectId).filter(Boolean);
      const topIds = questionsWithSections.map(q => q.topicId).filter(Boolean);
      const [subjectsList, topicsList] = await Promise.all([
        Subject.find({ _id: { $in: subIds } }).select('title').lean(),
        Topic.find({ _id: { $in: topIds } }).select('title').lean(),
      ]);
      const subNameMap = new Map(subjectsList.map(s => [s._id.toString(), s.title]));
      const topNameMap = new Map(topicsList.map(t => [t._id.toString(), t.title]));

      questionsWithSections.forEach(q => {
        if (q.difficulty) difficultyDistribution[q.difficulty] = (difficultyDistribution[q.difficulty] || 0) + 1;
        if (q.sourceType) sourceDistribution[q.sourceType] = (sourceDistribution[q.sourceType] || 0) + 1;
        const subName = q.subjectId ? (subNameMap.get(q.subjectId.toString()) || 'Unknown') : 'No Subject';
        const topName = q.topicId ? (topNameMap.get(q.topicId.toString()) || 'Unknown') : 'No Topic';
        subjectDistribution[subName] = (subjectDistribution[subName] || 0) + 1;
        topicDistribution[topName] = (topicDistribution[topName] || 0) + 1;
      });

      return {
        selectedQuestions: questionsWithSections,
        selectionSummary: {
          selectedCount,
          requestedCount,
          difficultyDistribution,
          sourceDistribution,
          subjectDistribution,
          topicDistribution,
          reusedRecentQuestionCount: 0,
        },
        shortageDetails,
        canStart: selectedCount > 0,
      };
    }

    // ── DYNAMIC SELECTION MODE ──
    // Fetch User's Attempts history if excludeRecentAttemptedDays is active
    const attemptedTimes = new Map();
    if (excludeRecentAttemptedDays > 0 && userId) {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - excludeRecentAttemptedDays);
      try {
        const attempts = await MockTestAttempt.find({
          userId,
          status: { $in: ['submitted', 'started'] },
        }).select('questions startedAt submittedAt').lean();

        attempts.forEach(att => {
          const attemptTime = att.submittedAt || att.startedAt || new Date();
          if (attemptTime >= thresholdDate) {
            att.questions.forEach(q => {
              if (q.questionId) {
                const qStr = q.questionId.toString();
                const prev = attemptedTimes.get(qStr);
                if (!prev || attemptTime > prev) attemptedTimes.set(qStr, attemptTime);
              }
            });
          }
        });
      } catch (err) {
        console.error('Error fetching attempts for mock selector:', err);
      }
    }

    const selectedQuestionIds = new Set();
    const finalSelectedQuestions = [];
    const shortageDetails = {};
    let canStart = true;
    let reusedRecentCount = 0;

    // Difficulty breakdown per section based on selectionRules.difficultyDistribution or defaults
    const diffRules = selectionRules.difficultyDistribution || { easy: 25, medium: 50, hard: 25 };
    const easyRatio = (diffRules.easy || 25) / 100;
    const mediumRatio = (diffRules.medium || 50) / 100;
    const hardRatio = (diffRules.hard || 25) / 100;

    let overallOrder = 1;

    for (const section of sections) {
      const secId = section._id.toString();
      const targetCount = section.questionCount;
      const subIds = parseIds(section.subjectIds);
      const topIds = parseIds(section.topicIds);

      // Section specific base query
      const baseQuery = {
        qualityStatus: 'approved',
        isVerified: true,
        isPublished: true,
        isArchived: { $ne: true },
        examId: examId,
        phaseId: phaseId,
      };

      if (subIds.length > 0) baseQuery.subjectId = { $in: subIds.map(id => new mongoose.Types.ObjectId(id)) };
      if (topIds.length > 0) baseQuery.topicId = { $in: topIds.map(id => new mongoose.Types.ObjectId(id)) };
      if (language && language !== 'bilingual') baseQuery.language = language;

      // Handle includes/excludes sourceType
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
        Object.assign(baseQuery, sourceConditions[0]);
      } else if (sourceConditions.length > 1) {
        baseQuery.$or = sourceConditions;
      } else {
        baseQuery._id = null; // matches nothing
      }

      // Fetch all candidate questions for this section
      const candidates = await Question.find(baseQuery).lean();

      // Exclude already selected questions
      let availableCandidates = candidates.filter(q => !selectedQuestionIds.has(q._id.toString()));

      // Prioritize unattempted or non-recently attempted questions
      const scoredCandidates = availableCandidates.map(q => {
        const qIdStr = q._id.toString();
        const lastAttempt = attemptedTimes.get(qIdStr);
        let priorityScore = 0;
        if (!lastAttempt) {
          priorityScore += 1000;
        } else {
          // Attempted recently, assign age-based penalty/benefit
          const ageMs = new Date() - new Date(lastAttempt);
          priorityScore += (ageMs / (24 * 3600 * 1000)); // older attempt = higher score
        }
        return { q, score: priorityScore + Math.random() };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      const rankedCandidates = scoredCandidates.map(sc => sc.q);

      // Section targets per difficulty
      const targetEasy = Math.round(targetCount * easyRatio);
      const targetMedium = Math.round(targetCount * mediumRatio);
      const targetHard = targetCount - targetEasy - targetMedium;

      const easyCandidates = rankedCandidates.filter(q => q.difficulty === 'easy');
      const mediumCandidates = rankedCandidates.filter(q => q.difficulty === 'medium');
      const hardCandidates = rankedCandidates.filter(q => q.difficulty === 'hard');

      const selectedFromSec = [];

      const grabFromPool = (pool, count) => {
        const grabbed = pool.slice(0, count);
        grabbed.forEach(q => {
          selectedQuestionIds.add(q._id.toString());
          const lastAttempt = attemptedTimes.get(q._id.toString());
          if (lastAttempt) reusedRecentCount++;
          
          selectedFromSec.push({
            ...q,
            sectionId: secId,
            questionOrder: overallOrder++
          });
        });
      };

      // Fulfill difficulty quotas
      grabFromPool(easyCandidates, targetEasy);
      grabFromPool(mediumCandidates, targetMedium);
      grabFromPool(hardCandidates, targetHard);

      // Deficit filler: if section count isn't reached, grab from any remaining candidates in this section
      const selectedIdsForSec = new Set(selectedFromSec.map(q => q._id.toString()));
      const remainingSectionCandidates = rankedCandidates.filter(q => !selectedIdsForSec.has(q._id.toString()) && !selectedQuestionIds.has(q._id.toString()));

      if (selectedFromSec.length < targetCount && remainingSectionCandidates.length > 0) {
        const needed = targetCount - selectedFromSec.length;
        grabFromPool(remainingSectionCandidates, needed);
      }

      // Record shortages if still deficient
      if (selectedFromSec.length < targetCount) {
        shortageDetails[section.name] = {
          requested: targetCount,
          available: selectedFromSec.length,
          shortage: targetCount - selectedFromSec.length,
          message: `Insufficient questions in ${section.name}`
        };
        canStart = false;
      }

      finalSelectedQuestions.push(...selectedFromSec);
    }

    // Generate Distributions for selectionSummary
    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
    const sourceDistribution = {};
    const subjectDistribution = {};
    const topicDistribution = {};

    const subIds = finalSelectedQuestions.map(q => q.subjectId).filter(Boolean);
    const topIds = finalSelectedQuestions.map(q => q.topicId).filter(Boolean);
    const [subjectsList, topicsList] = await Promise.all([
      Subject.find({ _id: { $in: subIds } }).select('title').lean(),
      Topic.find({ _id: { $in: topIds } }).select('title').lean(),
    ]);
    const subNameMap = new Map(subjectsList.map(s => [s._id.toString(), s.title]));
    const topNameMap = new Map(topicsList.map(t => [t._id.toString(), t.title]));

    finalSelectedQuestions.forEach(q => {
      if (q.difficulty) difficultyDistribution[q.difficulty] = (difficultyDistribution[q.difficulty] || 0) + 1;
      if (q.sourceType) sourceDistribution[q.sourceType] = (sourceDistribution[q.sourceType] || 0) + 1;
      const subName = q.subjectId ? (subNameMap.get(q.subjectId.toString()) || 'Unknown') : 'No Subject';
      const topName = q.topicId ? (topNameMap.get(q.topicId.toString()) || 'Unknown') : 'No Topic';
      subjectDistribution[subName] = (subjectDistribution[subName] || 0) + 1;
      topicDistribution[topName] = (topicDistribution[topName] || 0) + 1;
    });

    const totalSelected = finalSelectedQuestions.length;
    const totalRequested = sections.reduce((acc, s) => acc + s.questionCount, 0);

    return {
      selectedQuestions: finalSelectedQuestions,
      selectionSummary: {
        selectedCount: totalSelected,
        requestedCount: totalRequested,
        difficultyDistribution,
        sourceDistribution,
        subjectDistribution,
        topicDistribution,
        reusedRecentQuestionCount: reusedRecentCount,
      },
      shortageDetails,
      canStart,
    };
  } catch (error) {
    console.error('Error generating mock questions:', error);
    throw error;
  }
}

/**
 * 2. calculateMockResult(attemptId)
 */
export async function calculateMockResult(attemptId) {
  try {
    const attempt = await MockTestAttempt.findById(attemptId);
    if (!attempt) throw new Error('MockTestAttempt not found.');

    const mockTest = await MockTest.findById(attempt.mockTestId);
    if (!mockTest) throw new Error('MockTest not found.');

    const attemptQuestions = attempt.questions || [];
    const questionIds = attemptQuestions.map(q => q.questionId);
    
    // Load question details from DB
    const dbQuestions = await Question.find({ _id: { $in: questionIds } })
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();
      
    const dbQuestionMap = new Map(dbQuestions.map(q => [q._id.toString(), q]));

    // Map mock test sections
    const sectionMap = new Map((mockTest.examPattern.sections || []).map(s => [s._id.toString(), s]));

    // Core variables
    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let timeTakenSeconds = 0;

    // Trackers
    const sectionStats = new Map();
    const subjectStats = new Map();
    const topicStats = new Map();

    const incorrectQuestionOps = [];

    // Initialize section trackers
    sectionMap.forEach((sec, key) => {
      sectionStats.set(key, {
        sectionId: key,
        sectionName: sec.name,
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        score: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      });
    });

    attemptQuestions.forEach(aq => {
      const qIdStr = aq.questionId.toString();
      const question = dbQuestionMap.get(qIdStr);
      if (!question) return;

      const secId = aq.sectionId;
      const section = sectionMap.get(secId);
      
      const marks = section ? section.marksPerQuestion : (question.marks || 2);
      const negativeMarks = section ? section.negativeMarks : (question.negativeMarks || 0.66);

      totalMarks += marks;
      timeTakenSeconds += aq.timeSpentSeconds || 0;

      const selected = aq.selectedAnswer ? aq.selectedAnswer.trim() : '';
      const correct = question.correctAnswer ? question.correctAnswer.trim() : '';

      let status = 'skipped';
      if (!selected) {
        status = 'skipped';
        skippedCount++;
      } else if (selected === correct) {
        status = 'correct';
        correctCount++;
        score += marks;
      } else {
        status = 'incorrect';
        incorrectCount++;
        score -= negativeMarks;

        // Queue revision scheduling for incorrect answers
        if (question.subjectId && question.topicId) {
          incorrectQuestionOps.push({
            userId: attempt.userId,
            questionId: question._id,
            examId: attempt.examId,
            phaseId: attempt.phaseId,
            subjectId: question.subjectId?._id || question.subjectId,
            topicId: question.topicId?._id || question.topicId,
          });
        }
      }

      // Record Section performance
      if (sectionStats.has(secId)) {
        const stats = sectionStats.get(secId);
        stats.total++;
        stats.timeSpentSeconds += aq.timeSpentSeconds || 0;
        if (status === 'correct') {
          stats.correct++;
          stats.score += marks;
        } else if (status === 'incorrect') {
          stats.incorrect++;
          stats.score -= negativeMarks;
        } else {
          stats.skipped++;
        }
      }

      // Record Subject Performance
      const subId = question.subjectId?._id?.toString() || question.subjectId?.toString() || 'unknown_subject';
      const subName = question.subjectId?.title || 'General Studies';
      if (!subjectStats.has(subId)) {
        subjectStats.set(subId, {
          subjectId: subId,
          subjectName: subName,
          total: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          score: 0,
          attempted: 0,
        });
      }
      const subS = subjectStats.get(subId);
      subS.total++;
      if (status === 'correct') {
        subS.correct++;
        subS.score += marks;
        subS.attempted++;
      } else if (status === 'incorrect') {
        subS.incorrect++;
        subS.score -= negativeMarks;
        subS.attempted++;
      } else {
        subS.skipped++;
      }

      // Record Topic Performance
      const topId = question.topicId?._id?.toString() || question.topicId?.toString() || 'unknown_topic';
      const topName = question.topicId?.title || 'General Concept';
      if (!topicStats.has(topId)) {
        topicStats.set(topId, {
          topicId: topId,
          topicName: topName,
          total: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          score: 0,
          attempted: 0,
        });
      }
      const topS = topicStats.get(topId);
      topS.total++;
      if (status === 'correct') {
        topS.correct++;
        topS.score += marks;
        topS.attempted++;
      } else if (status === 'incorrect') {
        topS.incorrect++;
        topS.score -= negativeMarks;
        topS.attempted++;
      } else {
        topS.skipped++;
      }
    });

    // Compute Section averages
    const sectionPerformance = Array.from(sectionStats.values()).map(stats => {
      const attempted = stats.correct + stats.incorrect;
      stats.accuracy = attempted > 0 ? Number(((stats.correct / attempted) * 100).toFixed(2)) : 0;
      stats.score = Number(stats.score.toFixed(2));
      return stats;
    });

    // Compute Subject averages
    const subjectPerformance = Array.from(subjectStats.values()).map(s => {
      const acc = s.attempted > 0 ? (s.correct / s.attempted) * 100 : 0;
      return {
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        total: s.total,
        correct: s.correct,
        incorrect: s.incorrect,
        skipped: s.skipped,
        score: Number(s.score.toFixed(2)),
        accuracy: Number(acc.toFixed(2)),
      };
    });

    // Compute Topic averages
    const topicPerformance = Array.from(topicStats.values()).map(t => {
      const acc = t.attempted > 0 ? (t.correct / t.attempted) * 100 : 0;
      return {
        topicId: t.topicId,
        topicName: t.topicName,
        total: t.total,
        correct: t.correct,
        incorrect: t.incorrect,
        skipped: t.skipped,
        score: Number(t.score.toFixed(2)),
        accuracy: Number(acc.toFixed(2)),
      };
    });

    // Weak topics (accuracy < 50% on at least 2 attempts or 2 questions in test)
    const weakTopics = Array.from(topicStats.values())
      .filter(t => {
        const acc = t.attempted > 0 ? (t.correct / t.attempted) * 100 : 0;
        return t.attempted >= 2 && acc < 50;
      })
      .map(t => t.topicId);

    // Compute attempt percentages
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(2)) : 0;

    // Save attempt results
    attempt.score = Number(score.toFixed(2));
    attempt.totalMarks = totalMarks;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.skippedCount = skippedCount;
    attempt.accuracy = accuracy;
    attempt.timeTakenSeconds = timeTakenSeconds;
    attempt.sectionPerformance = sectionPerformance;
    attempt.subjectPerformance = subjectPerformance;
    attempt.topicPerformance = topicPerformance;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.resultGenerated = true;

    // Generate feedback
    const feedback = generateMockFeedback(attempt);
    attempt.feedback = feedback;
    attempt.feedbackGenerated = true;

    await attempt.save();

    // Recalculate ranks and percentiles for this Mock Test (synchronize database)
    await updateMockRanksAndPercentiles(attempt.mockTestId);

    // Create revision items for wrong answers
    if (incorrectQuestionOps.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const promises = incorrectQuestionOps.map(op => {
        return RevisionItem.findOneAndUpdate(
          { userId: op.userId, questionId: op.questionId },
          {
            $setOnInsert: {
              userId: op.userId,
              questionId: op.questionId,
              examId: op.examId,
              phaseId: op.phaseId,
              subjectId: op.subjectId,
              topicId: op.topicId,
              sourceType: 'wrong_answer',
            },
            $set: {
              priority: 'high',
              status: 'pending',
              nextRevisionDate: tomorrow,
            }
          },
          { upsert: true, new: true }
        );
      });
      await Promise.all(promises);
    }

    return attempt;
  } catch (error) {
    console.error('Error calculating mock test result:', error);
    throw error;
  }
}

/**
 * Recalculate ranks & percentiles across all submitted attempts for a MockTest
 */
export async function updateMockRanksAndPercentiles(mockTestId) {
  try {
    const attempts = await MockTestAttempt.find({
      mockTestId,
      status: 'submitted',
    }).sort({ score: -1, timeTakenSeconds: 1 });

    const total = attempts.length;
    if (total < 2) return; // Rank rules require at least 2 attempts

    const updatePromises = attempts.map((att, idx) => {
      const rank = idx + 1;
      const percentile = Number((((total - rank) / (total - 1)) * 100).toFixed(2));
      return MockTestAttempt.findByIdAndUpdate(att._id, { rank, percentile });
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating mock ranks:', error);
  }
}

/**
 * 3. generateMockFeedback(attempt)
 */
export function generateMockFeedback(attempt) {
  const { accuracy, score, totalMarks, incorrectCount, sectionPerformance = [], subjectPerformance = [], topicPerformance = [] } = attempt;

  // Category determination
  let overallCategory = 'needs_attention';
  if (accuracy >= 80) overallCategory = 'excellent';
  else if (accuracy >= 60) overallCategory = 'good';
  else if (accuracy >= 40) overallCategory = 'needs_improvement';

  // Weak areas
  const weakSubjects = subjectPerformance.filter(s => s.accuracy < 50).map(s => s.subjectName);
  const weakTopics = topicPerformance.filter(t => t.accuracy < 50).map(t => t.topicName);

  // Time management feedback
  let timeManagement = 'Excellent pacing throughout the sections. Keep maintaining this speed.';
  const totalSecs = attempt.timeTakenSeconds || 0;
  const totalQ = attempt.totalQuestions || 1;
  const avgSeconds = totalSecs / totalQ;
  if (avgSeconds > 100) {
    timeManagement = 'Pacing is slightly slow. Focus on reducing question review cycles to avoid shortage at the end.';
  } else if (avgSeconds < 30 && accuracy < 60) {
    timeManagement = 'Extremely quick attempts but low accuracy. Consider reading options more carefully to reduce silly errors.';
  }

  // Negative marking impact
  const penalty = incorrectCount * 0.33; // estimated default
  let negativeMarkingFeedback = 'Negative marking impact is minor. Good selection filtering.';
  if (incorrectCount > totalQ * 0.25) {
    negativeMarkingFeedback = `Warning: High penalty warning. You lost approximately ${penalty.toFixed(2)} marks to negative attempts. Be more cautious about guesswork.`;
  }

  // Recommendations
  const recommendedActions = [];
  if (weakSubjects.length > 0) {
    recommendedActions.push(`Spend active revision cycles on: ${weakSubjects.slice(0, 3).join(', ')}.`);
  }
  if (weakTopics.length > 0) {
    recommendedActions.push(`Attempt 15-question targeted topic-wise revision sets on: ${weakTopics.slice(0, 3).join(', ')}.`);
  }
  recommendedActions.push('Review the detailed answer key for incorrect options and add weak items to bookmarks.');

  let encouragement = 'Consistent mock test practice builds subject resilience. Keep studying!';
  if (overallCategory === 'excellent') {
    encouragement = 'Outstanding performance! You show solid concept ownership. Keep simulating under time bounds.';
  } else if (overallCategory === 'needs_attention') {
    encouragement = 'Take standard revisions and review basic concepts before starting another full mock test.';
  }

  return {
    overallCategory,
    timeManagement,
    accuracyFeedback: `Overall accuracy is ${accuracy}%. A target accuracy of 75%+ is recommended for prelims.`,
    negativeMarkingFeedback,
    weakSubjects,
    weakTopics,
    recommendedActions,
    encouragementMessage: encouragement
  };
}
