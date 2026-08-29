import mongoose from 'mongoose';
import Question from '../models/Question.js';
import PracticeSession from '../models/PracticeSession.js';
import RevisionItem from '../models/RevisionItem.js';
import MistakeNotebook from '../models/MistakeNotebook.js';
import Bookmark from '../models/Bookmark.js';

/**
 * Normalizes input filters into Mongo ObjectIds or strings.
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
 * Fisher-Yates shuffle with random fraction injection.
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
 * Smart Question Selector Service
 */
export const selectQuestionsForPractice = async ({
  userId,
  examId,
  phaseId,
  subjectIds = [],
  topicIds = [],
  subtopicIds = [],
  difficulty,
  language,
  mode = 'practice',
  includeOriginalPractice = true,
  includePYQ = true,
  requestedQuestionCount = 10,
  practiceSessionId = null
}) => {
  // 1. Parse and format IDs
  const subIds = parseIds(subjectIds);
  const topIds = parseIds(topicIds);
  const subtopIds = parseIds(subtopicIds);
  const targetCount = Number(requestedQuestionCount) || 10;

  // 2. Fetch User's Attempts history to prevent repeats
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attemptedTimes = new Map(); // questionId -> timestamp

  try {
    // A. Practice Sessions attempts
    const recentSessions = await PracticeSession.find({
      userId,
      status: { $in: ['submitted', 'started', 'expired'] }
    }).select('questions questionIds startedAt submittedAt').lean();

    recentSessions.forEach(sess => {
      const time = sess.submittedAt || sess.startedAt || new Date();
      if (sess.questions && sess.questions.length > 0) {
        sess.questions.forEach(q => {
          if (q.questionId) {
            const qStr = q.questionId.toString();
            const prev = attemptedTimes.get(qStr);
            if (!prev || time > prev) attemptedTimes.set(qStr, time);
          }
        });
      } else if (sess.questionIds) {
        sess.questionIds.forEach(id => {
          const qStr = id.toString();
          const prev = attemptedTimes.get(qStr);
          if (!prev || time > prev) attemptedTimes.set(qStr, time);
        });
      }
    });

    // B. Paper Attempts
    let PaperAttempt;
    try { PaperAttempt = mongoose.model('PaperAttempt'); } catch (e) {}
    if (PaperAttempt) {
      const recentPaperAttempts = await PaperAttempt.find({
        userId,
        status: { $in: ['submitted', 'started', 'expired'] }
      }).select('answers createdAt').lean();

      recentPaperAttempts.forEach(pa => {
        if (pa.answers) {
          pa.answers.forEach(ans => {
            if (ans.questionId) {
              const qStr = ans.questionId.toString();
              const prev = attemptedTimes.get(qStr);
              if (!prev || pa.createdAt > prev) attemptedTimes.set(qStr, pa.createdAt);
            }
          });
        }
      });
    }

    // C. Test Attempts
    let TestAttempt;
    try { TestAttempt = mongoose.model('TestAttempt'); } catch (e) {}
    if (TestAttempt) {
      const recentTestAttempts = await TestAttempt.find({
        userId,
        createdAt: { $gt: thirtyDaysAgo }
      }).select('questions createdAt').lean();

      recentTestAttempts.forEach(ta => {
        if (ta.questions) {
          ta.questions.forEach(q => {
            const qId = q.questionId || q.id;
            if (qId) {
              const qStr = qId.toString();
              const prev = attemptedTimes.get(qStr);
              if (!prev || ta.createdAt > prev) attemptedTimes.set(qStr, ta.createdAt);
            }
          });
        }
      });
    }
  } catch (err) {
    console.error('Error fetching attempts history:', err);
  }

  // 3. Build base query for Question model
  const query = {
    qualityStatus: 'approved',
    isVerified: true,
    isPublished: true,
    isArchived: { $ne: true }
  };

  if (examId) query.examId = new mongoose.Types.ObjectId(examId);
  if (phaseId) query.phaseId = new mongoose.Types.ObjectId(phaseId);
  if (subIds.length > 0) {
    query.subjectId = { $in: subIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  if (topIds.length > 0) {
    query.topicId = { $in: topIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  if (subtopIds.length > 0) {
    query.subtopicId = { $in: subtopIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  if (language) query.language = language;

  // Apply strict difficulty constraint if specific difficulty is selected (non-mixed)
  if (difficulty && difficulty !== 'mixed') {
    query.difficulty = difficulty;
  }

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
    Object.assign(query, sourceConditions[0]);
  } else if (sourceConditions.length > 1) {
    query.$or = sourceConditions;
  } else {
    query._id = null; // Matches nothing
  }

  // Load all candidates matching base criteria
  const candidates = await Question.find(query).lean();
  if (candidates.length === 0) {
    return {
      questions: [],
      selectionSummary: {
        selectedCount: 0,
        requestedCount: targetCount,
        subjectDistribution: {},
        topicDistribution: {},
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
        sourceDistribution: {},
        reusedRecentQuestionCount: 0,
        usedNonPYQFallbackCount: 0
      }
    };
  }

  // 4. Mode-specific ranking and prioritization
  let prioritizedPool = [];
  let usedNonPYQFallbackCount = 0;
  let isPYQFallbackActive = false;

  if (mode === 'revision') {
    // ── REVISION MODE ──
    const currentDate = new Date();
    
    // Prioritize RevisionItem where status = pending and nextRevisionDate <= currentDate
    const revisionItems = await RevisionItem.find({ userId }).lean();
    const revisionMap = new Map(revisionItems.map(item => [item.questionId.toString(), item]));

    // Find bookmarks
    const bookmarkDocs = await Bookmark.find({ userId }).select('questionId').lean();
    const bookmarkSet = new Set(bookmarkDocs.map(b => b.questionId.toString()));

    // Find weak topics (MistakeNotebook mistakes resolved=false)
    const mistakes = await MistakeNotebook.find({ userId, resolved: false })
      .select('questionId')
      .populate({ path: 'questionId', select: 'topicId' })
      .lean();
    const weakTopicIds = new Set(mistakes.map(m => m.questionId?.topicId?.toString()).filter(Boolean));

    // Categorize candidates
    const groupA = []; // Pending wrong_answer revision items
    const groupB = []; // Pending bookmarked revision items
    const groupC = []; // Bookmarked questions (Bookmarks or isBookmarked)
    const groupD = []; // Weak-topic questions
    const groupE = []; // Standard questions (not mastered)
    const groupF = []; // Mastered questions

    candidates.forEach(q => {
      const qIdStr = q._id.toString();
      const rev = revisionMap.get(qIdStr);
      
      const isMastered = rev?.status === 'mastered' || (rev?.masteryScore >= 80);
      const isPending = rev?.status === 'pending' && new Date(rev.nextRevisionDate) <= currentDate;
      
      if (isMastered) {
        groupF.push(q);
        return;
      }

      if (isPending) {
        if (rev.sourceType === 'wrong_answer') {
          groupA.push(q);
        } else if (rev.sourceType === 'bookmarked') {
          groupB.push(q);
        } else {
          groupC.push(q);
        }
        return;
      }

      if (bookmarkSet.has(qIdStr) || rev?.isBookmarked) {
        groupC.push(q);
        return;
      }

      if (q.topicId && weakTopicIds.has(q.topicId.toString())) {
        groupD.push(q);
        return;
      }

      groupE.push(q);
    });

    // Revision mode bypasses recent exclusion for pending revision items, but applies it to the rest
    const filterRecent = (list) => {
      return list.filter(q => {
        const lastTime = attemptedTimes.get(q._id.toString());
        if (!lastTime) return true;
        const diffDays = (new Date() - new Date(lastTime)) / (1000 * 3600 * 24);
        return diffDays >= 30;
      });
    };

    // Keep all pending due revision questions (Groups A & B), but filter others
    const filteredC = filterRecent(groupC);
    const filteredD = filterRecent(groupD);
    const filteredE = filterRecent(groupE);

    prioritizedPool = [
      ...shuffle(groupA),
      ...shuffle(groupB),
      ...shuffle(filteredC.length > 0 ? filteredC : groupC),
      ...shuffle(filteredD.length > 0 ? filteredD : groupD),
      ...shuffle(filteredE.length > 0 ? filteredE : groupE),
      ...shuffle(groupF)
    ];

  } else if (mode === 'pyq') {
    // ── PYQ MODE ──
    // Prefer sourceType = official_pyq or verified_previous_year or isPreviousYearQuestion = true
    const isPYQ = (q) => q.isPreviousYearQuestion || ['official_pyq', 'verified_previous_year'].includes(q.sourceType);

    const pyqs = candidates.filter(isPYQ);
    const nonPyqs = candidates.filter(q => !isPYQ(q));

    // Sort PYQs by sourceYear descending (latest first)
    const sortedPyqs = pyqs.sort((a, b) => (b.sourceYear || 0) - (a.sourceYear || 0));

    // Filter recent attempts for PYQs
    const pyqsPool = sortedPyqs.filter(q => {
      const lastTime = attemptedTimes.get(q._id.toString());
      if (!lastTime) return true;
      const diffDays = (new Date() - new Date(lastTime)) / (1000 * 3600 * 24);
      return diffDays >= 30;
    });

    const finalPyqCandidates = pyqsPool.length >= targetCount ? pyqsPool : sortedPyqs;

    if (finalPyqCandidates.length < targetCount && originalActive) {
      isPYQFallbackActive = true;
      // Prefer original practice with high_frequency or repeated_theme tags
      const prefers = (q) => (q.tags || []).some(t => ['high_frequency', 'repeated_theme', 'foundation', 'expected'].includes(t));
      const sortedNonPyqs = nonPyqs.sort((a, b) => (prefers(b) ? 1 : 0) - (prefers(a) ? 1 : 0));
      prioritizedPool = [...finalPyqCandidates, ...shuffle(sortedNonPyqs)];
    } else {
      prioritizedPool = finalPyqCandidates;
    }

  } else {
    // ── PRACTICE or MOCK MODE ──
    const preferredTags = ['high_frequency', 'repeated_theme', 'foundation', 'expected'];
    
    // Sort / Rank candidates
    // Prefer unattempted and highly tagged
    const scoredCandidates = candidates.map(q => {
      const qIdStr = q._id.toString();
      const lastAttempt = attemptedTimes.get(qIdStr);
      const isUnattempted = !lastAttempt;
      const hasRecent = lastAttempt && (new Date() - new Date(lastAttempt)) < (30 * 24 * 3600 * 1000);

      // Score components
      let score = 0;
      if (isUnattempted) score += 1000;
      else if (!hasRecent) score += 500; // attempted, but over 30 days ago
      else {
        // attempted within 30 days. prefer least recently attempted (older attempt time)
        const ageInMs = new Date() - new Date(lastAttempt);
        score += (ageInMs / (24 * 3600 * 1000)); // adds points based on days since attempt
      }

      // Add tag preferences
      const matchingTags = (q.tags || []).filter(t => preferredTags.includes(t)).length;
      score += matchingTags * 10;

      // Add small random noise to prevent full determinism
      score += Math.random();

      return { q, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    prioritizedPool = scoredCandidates.map(sc => sc.q);
  }

  // 5. Multi-Subject & Multi-Topic Balance & Difficulty Distribution
  // Let's first build subject maps, topic maps, and difficulty maps
  const easyPool = prioritizedPool.filter(q => q.difficulty === 'easy');
  const mediumPool = prioritizedPool.filter(q => q.difficulty === 'medium');
  const hardPool = prioritizedPool.filter(q => q.difficulty === 'hard');

  let targetEasy = 0;
  let targetMedium = 0;
  let targetHard = 0;

  if (difficulty && difficulty !== 'mixed') {
    if (difficulty === 'easy') targetEasy = targetCount;
    else if (difficulty === 'medium') targetMedium = targetCount;
    else if (difficulty === 'hard') targetHard = targetCount;
  } else {
    // mixed distribution: easy 25%, medium 50%, hard 25%
    targetEasy = Math.round(targetCount * 0.25);
    targetMedium = Math.round(targetCount * 0.50);
    targetHard = targetCount - targetEasy - targetMedium;
  }

  // Balanced Selector function within a difficulty pool
  const selectFromDifficultyPool = (pool, countToSelect) => {
    if (pool.length === 0 || countToSelect <= 0) return [];
    
    // Group questions by subject
    const subjectGroups = {};
    pool.forEach(q => {
      const subId = q.subjectId ? q.subjectId.toString() : 'none';
      if (!subjectGroups[subId]) subjectGroups[subId] = [];
      subjectGroups[subId].push(q);
    });

    const activeSubjects = Object.keys(subjectGroups);
    if (activeSubjects.length === 0) return [];

    let selected = [];
    let countRemaining = countToSelect;
    const subjectQuotas = {};

    // Initial equal quota distribution by subject
    const baseQuota = Math.floor(countToSelect / activeSubjects.length);
    let remainder = countToSelect % activeSubjects.length;

    activeSubjects.forEach((sub, i) => {
      subjectQuotas[sub] = baseQuota + (i < remainder ? 1 : 0);
    });

    let deficit = 0;
    const subjectBacklog = {};

    activeSubjects.forEach(sub => {
      const qPool = subjectGroups[sub];
      const quota = subjectQuotas[sub];
      
      if (qPool.length <= quota) {
        selected.push(...qPool);
        countRemaining -= qPool.length;
        deficit += (quota - qPool.length);
      } else {
        // Group by topics inside subject
        const topicGroups = {};
        qPool.forEach(q => {
          const topId = q.topicId ? q.topicId.toString() : 'none';
          if (!topicGroups[topId]) topicGroups[topId] = [];
          topicGroups[topId].push(q);
        });

        const activeTopics = Object.keys(topicGroups);
        const baseTopicQuota = Math.floor(quota / activeTopics.length);
        let topicRemainder = quota % activeTopics.length;

        activeTopics.forEach((top, ti) => {
          const tPool = topicGroups[top];
          const tQuota = baseTopicQuota + (ti < topicRemainder ? 1 : 0);
          
          if (tPool.length <= tQuota) {
            selected.push(...tPool);
            countRemaining -= tPool.length;
          } else {
            selected.push(...tPool.slice(0, tQuota));
            countRemaining -= tQuota;
            
            // Keep remaining in case we need to fulfill deficit
            if (!subjectBacklog[sub]) subjectBacklog[sub] = [];
            subjectBacklog[sub].push(...tPool.slice(tQuota));
          }
        });
      }
    });

    // Fulfill deficit using backlog
    if (deficit > 0 && countRemaining > 0) {
      let backlogPool = [];
      Object.keys(subjectBacklog).forEach(sub => {
        backlogPool.push(...subjectBacklog[sub]);
      });
      // Sort or shuffle backlog to match priority
      selected.push(...backlogPool.slice(0, countRemaining));
    }

    return selected;
  };

  // Run selection on each difficulty pool
  let finalSelected = [];

  let selectedEasy = selectFromDifficultyPool(easyPool, targetEasy);
  let selectedMedium = selectFromDifficultyPool(mediumPool, targetMedium);
  let selectedHard = selectFromDifficultyPool(hardPool, targetHard);

  finalSelected.push(...selectedEasy, ...selectedMedium, ...selectedHard);

  // Fill up if we have a deficit in count due to hard pool constraints
  if (finalSelected.length < targetCount) {
    const currentIds = new Set(finalSelected.map(q => q._id.toString()));
    const remainingCandidates = prioritizedPool.filter(q => !currentIds.has(q._id.toString()));
    
    // Select from remaining using simple balancing
    const extraNeeded = targetCount - finalSelected.length;
    const extras = selectFromDifficultyPool(remainingCandidates, extraNeeded);
    finalSelected.push(...extras);
  }

  // Ensure exact targetCount limit
  if (finalSelected.length > targetCount) {
    finalSelected = finalSelected.slice(0, targetCount);
  }

  // Count metrics for selection summary
  const selectedCount = finalSelected.length;
  let reusedRecentQuestionCount = 0;
  
  const subjectDistribution = {};
  const topicDistribution = {};
  const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
  const sourceDistribution = {};

  // Fetch subject and topic names for distribution labeling
  const finalSubjectIds = finalSelected.map(q => q.subjectId).filter(Boolean);
  const finalTopicIds = finalSelected.map(q => q.topicId).filter(Boolean);

  const [subjectDocs, topicDocs] = await Promise.all([
    mongoose.model('Subject').find({ _id: { $in: finalSubjectIds } }).select('title').lean(),
    mongoose.model('Topic').find({ _id: { $in: finalTopicIds } }).select('title').lean()
  ]);

  const subNameMap = new Map(subjectDocs.map(d => [d._id.toString(), d.title]));
  const topNameMap = new Map(topicDocs.map(d => [d._id.toString(), d.title]));

  finalSelected.forEach(q => {
    const qIdStr = q._id.toString();
    const lastAttempt = attemptedTimes.get(qIdStr);
    
    // Check if attempted in last 30 days
    if (lastAttempt && (new Date() - new Date(lastAttempt)) < (30 * 24 * 3600 * 1000)) {
      reusedRecentQuestionCount++;
    }

    // Classify fallback usage in PYQ mode
    const isPYQ = q.isPreviousYearQuestion || ['official_pyq', 'verified_previous_year'].includes(q.sourceType);
    if (mode === 'pyq' && !isPYQ) {
      usedNonPYQFallbackCount++;
    }

    // Distributions
    const subTitle = q.subjectId ? (subNameMap.get(q.subjectId.toString()) || 'Unknown') : 'No Subject';
    const topTitle = q.topicId ? (topNameMap.get(q.topicId.toString()) || 'Unknown') : 'No Topic';

    subjectDistribution[subTitle] = (subjectDistribution[subTitle] || 0) + 1;
    topicDistribution[topTitle] = (topicDistribution[topTitle] || 0) + 1;

    if (q.difficulty && difficultyDistribution[q.difficulty] !== undefined) {
      difficultyDistribution[q.difficulty]++;
    }

    const src = q.sourceType || 'unknown';
    sourceDistribution[src] = (sourceDistribution[src] || 0) + 1;
  });

  return {
    questions: finalSelected,
    selectionSummary: {
      selectedCount,
      requestedCount: targetCount,
      subjectDistribution,
      topicDistribution,
      difficultyDistribution,
      sourceDistribution,
      reusedRecentQuestionCount,
      usedNonPYQFallbackCount
    }
  };
};
