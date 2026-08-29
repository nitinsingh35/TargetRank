import Question from '../models/Question.js';
import UserQuestionHistory from '../models/UserQuestionHistory.js';
import ExamPracticeConfig from '../models/ExamPracticeConfig.js';
import PracticeSession from '../models/PracticeSession.js';
import RevisionItem from '../models/RevisionItem.js';
import MistakeNotebook from '../models/MistakeNotebook.js';

// Shuffler
const shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const selectQuestionsForSession = async (params) => {
  const {
    userId,
    examId,
    phaseId,
    mode = 'smart_mixed',
    durationMinutes = 30,
    subjectIds = [],
    topicIds = [],
    difficultyPreference = 'mixed',
    language = 'english',
    sourceFilter = 'all',
    allowRepeats = false,
    currentAffairsMonth = null,
    currentAffairsYear = null,
    questionCount = null,
  } = params;

  // 1. Determine minutes per question based on exam type
  let minutesPerQuestion = 1.5;
  const config = await ExamPracticeConfig.findOne({ examId });
  if (config) {
    minutesPerQuestion = config.defaultMinutesPerQuestion;
  } else {
    // Fallback timings
    // UPSC (2 minutes), SSC/Banking (1 minute)
    if (examId && examId.toString() === '6a4d1b13e3499ec45f8c3216') {
      minutesPerQuestion = 2.0;
    } else if (examId && (examId.toString() === '6a4d1b15e3499ec45f8c3224' || examId.toString() === '6a4d1b15e3499ec45f8c3228')) {
      minutesPerQuestion = 1.0;
    }
  }

  const targetQuestionCount = questionCount ? Number(questionCount) : Math.max(5, Math.ceil(durationMinutes / minutesPerQuestion));

  // 2. Identify no-repeat exclusions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const attemptedHistory = await UserQuestionHistory.find({
    userId,
    lastAttemptedAt: { $gt: thirtyDaysAgo },
  }).select('questionId');
  const attemptedIds = attemptedHistory.map((h) => h.questionId.toString());

  // 3. Compile matching query base
  const query = {
    isPublished: true,
    isArchived: { $ne: true }
  };
  if (examId) query.examId = examId;
  if (phaseId) query.phaseId = phaseId;
  
  if (params.subjectId) query.subjectId = params.subjectId;
  if (subjectIds && subjectIds.length > 0) query.subjectId = { $in: subjectIds };
  
  if (params.topicId) query.topicId = params.topicId;
  if (topicIds && topicIds.length > 0) query.topicId = { $in: topicIds };
  
  if (params.subtopicId) query.subtopicId = params.subtopicId;

  if (params.questionType && params.questionType !== 'all') {
    query.questionType = params.questionType;
  }

  if (language && language !== 'all') {
    query.language = language;
  }

  if (difficultyPreference && difficultyPreference !== 'mixed') {
    query.difficulty = difficultyPreference;
  }

  // Source filters
  if (sourceFilter === 'official_pyq' || sourceFilter === 'previous_year') {
    // Matches both isPreviousYearQuestion flag and official_pyq / verified_previous_year sourceType
    query.$or = [
      { isPreviousYearQuestion: true },
      { sourceType: { $in: ['official_pyq', 'verified_previous_year', 'previous_year'] } },
    ];
  } else if (sourceFilter === 'original_practice' || sourceFilter === 'practice') {
    query.sourceType = { $in: ['original_practice', 'practice_generated', 'mentor_created', 'pyq_inspired', 'book_based_concept_practice', 'original', 'practice'] };
    query.isPreviousYearQuestion = { $ne: true };
  } else if (sourceFilter === 'current_affairs') {
    query.sourceType = 'current_affairs';
    if (currentAffairsMonth) query.currentAffairsMonth = Number(currentAffairsMonth);
    if (currentAffairsYear) query.currentAffairsYear = Number(currentAffairsYear);
  } else if (sourceFilter === 'book_based') {
    query.sourceType = { $in: ['book_based', 'book_based_concept_practice'] };
  } else if (sourceFilter === 'important') {
    query.importanceLevel = { $in: ['important', 'very_important', 'high_frequency', 'must_do'] };
  } else if (sourceFilter === 'bookmarked') {
    const User = await import('../models/User.js').then(m => m.default);
    const user = await User.findById(userId).select('bookmarks').lean();
    const bIds = (user?.bookmarks || []).map(id => id.toString());
    query._id = { $in: bIds };
  } else if (sourceFilter === 'mistake_notebook' || sourceFilter === 'weak_topics') {
    const mistakes = await MistakeNotebook.find({ userId, resolved: false }).select('questionId').lean();
    const mIds = mistakes.map(m => m.questionId.toString());
    query._id = { $in: mIds };
  }

  // Load all available candidate questions
  let candidates = await Question.find(query);

  if (candidates.length === 0) {
    throw new Error('No published questions match the selected criteria.');
  }

  // Apply no-repeat exclusions
  let warningRepeats = false;
  let finalCandidates = candidates;

  if (!allowRepeats) {
    const unattempted = candidates.filter((c) => !attemptedIds.includes(c._id.toString()));
    if (unattempted.length >= targetQuestionCount) {
      finalCandidates = unattempted;
    } else {
      warningRepeats = true; // Not enough questions, fallback to allow repeats
    }
  }

  // 4. Group candidate questions to build the mode distribution
  // We classify candidates by attributes
  const pyqs = finalCandidates.filter(c => c.sourceType === 'verified_previous_year' || c.verifiedPYQ);
  const pyqInspired = finalCandidates.filter(c => c.sourceType === 'pyq_inspired');
  const mustDos = finalCandidates.filter(c => c.importanceLevel === 'must_do' || c.importanceLevel === 'very_important');
  const highWeightage = finalCandidates.filter(c => c.isHighWeightageTopic);
  
  // Weak-topic identifiers (topics where user had incorrect attempts in MistakeNotebook)
  const mistakes = await MistakeNotebook.find({ userId, resolved: false }).select('questionId');
  const mistakeQuestionIds = mistakes.map(m => m.questionId.toString());
  const mistakeQuestions = finalCandidates.filter(c => mistakeQuestionIds.includes(c._id.toString()));
  
  // Revision Items
  const revisions = await RevisionItem.find({ userId, status: 'pending' }).select('questionId');
  const revisionQuestionIds = revisions.map(r => r.questionId.toString());
  const revisionQuestions = finalCandidates.filter(c => revisionQuestionIds.includes(c._id.toString()));

  let selected = [];

  // Distribution logic
  if (mode === 'smart_mixed') {
    // 40% high-weightage topics, 25% verified PYQ, 20% weak topics, 15% random
    const limitHW = Math.ceil(targetQuestionCount * 0.40);
    const limitPYQ = Math.ceil(targetQuestionCount * 0.25);
    const limitWeak = Math.ceil(targetQuestionCount * 0.20);
    
    const hwSel = shuffle(highWeightage).slice(0, limitHW);
    const pyqSel = shuffle(pyqs).slice(0, limitPYQ);
    const weakSel = shuffle(mistakeQuestions).slice(0, limitWeak);

    const merged = [...hwSel, ...pyqSel, ...weakSel];
    const mergedIds = merged.map(m => m._id.toString());
    
    const remainingCount = targetQuestionCount - merged.length;
    const randomCandidates = finalCandidates.filter(c => !mergedIds.includes(c._id.toString()));
    const randSel = shuffle(randomCandidates).slice(0, Math.max(0, remainingCount));

    selected = [...merged, ...randSel];
  } else if (mode === 'important_only') {
    // 50% must_do, 30% verified PYQs, 20% high-weightage topic questions
    const limitMust = Math.ceil(targetQuestionCount * 0.50);
    const limitPYQ = Math.ceil(targetQuestionCount * 0.30);
    const limitHW = Math.ceil(targetQuestionCount * 0.20);

    const mustSel = shuffle(mustDos).slice(0, limitMust);
    const pyqSel = shuffle(pyqs).slice(0, limitPYQ);
    const hwSel = shuffle(highWeightage).slice(0, limitHW);

    const merged = [...mustSel, ...pyqSel, ...hwSel];
    const mergedIds = merged.map(m => m._id.toString());

    const remainingCount = targetQuestionCount - merged.length;
    const randomCandidates = finalCandidates.filter(c => !mergedIds.includes(c._id.toString()));
    const randSel = shuffle(randomCandidates).slice(0, Math.max(0, remainingCount));

    selected = [...merged, ...randSel];
  } else if (mode === 'pyq_important_mixed') {
    // 60% verified PYQs, 25% PYQ-inspired questions, 15% must_do questions
    const limitPYQ = Math.ceil(targetQuestionCount * 0.60);
    const limitInspired = Math.ceil(targetQuestionCount * 0.25);
    const limitMust = Math.ceil(targetQuestionCount * 0.15);

    const pyqSel = shuffle(pyqs).slice(0, limitPYQ);
    const inspSel = shuffle(pyqInspired).slice(0, limitInspired);
    const mustSel = shuffle(mustDos).slice(0, limitMust);

    const merged = [...pyqSel, ...inspSel, ...mustSel];
    const mergedIds = merged.map(m => m._id.toString());

    const remainingCount = targetQuestionCount - merged.length;
    const randomCandidates = finalCandidates.filter(c => !mergedIds.includes(c._id.toString()));
    const randSel = shuffle(randomCandidates).slice(0, Math.max(0, remainingCount));

    selected = [...merged, ...randSel];
  } else if (mode === 'weak_topics') {
    // 70% weak-topic questions, 20% previously incorrect questions, 10% easy confidence-building questions
    const limitWeak = Math.ceil(targetQuestionCount * 0.70);
    const limitIncorrect = Math.ceil(targetQuestionCount * 0.20);
    const limitEasy = Math.ceil(targetQuestionCount * 0.10);

    const weakSel = shuffle(mistakeQuestions).slice(0, limitWeak);
    const incorrectSel = shuffle(revisionQuestions).slice(0, limitIncorrect);
    const easySel = shuffle(finalCandidates.filter(c => c.difficulty === 'easy')).slice(0, limitEasy);

    const merged = [...weakSel, ...incorrectSel, ...easySel];
    const mergedIds = merged.map(m => m._id.toString());

    const remainingCount = targetQuestionCount - merged.length;
    const randomCandidates = finalCandidates.filter(c => !mergedIds.includes(c._id.toString()));
    const randSel = shuffle(randomCandidates).slice(0, Math.max(0, remainingCount));

    selected = [...merged, ...randSel];
  } else if (mode === 'revision_mode') {
    // 70% incorrect or bookmarked, 20% due for revision, 10% important
    const limitInc = Math.ceil(targetQuestionCount * 0.70);
    const limitDue = Math.ceil(targetQuestionCount * 0.20);
    const limitImp = Math.ceil(targetQuestionCount * 0.10);

    const incSel = shuffle(mistakeQuestions).slice(0, limitInc);
    const dueSel = shuffle(revisionQuestions).slice(0, limitDue);
    const impSel = shuffle(mustDos).slice(0, limitImp);

    const merged = [...incSel, ...dueSel, ...impSel];
    const mergedIds = merged.map(m => m._id.toString());

    const remainingCount = targetQuestionCount - merged.length;
    const randomCandidates = finalCandidates.filter(c => !mergedIds.includes(c._id.toString()));
    const randSel = shuffle(randomCandidates).slice(0, Math.max(0, remainingCount));

    selected = [...merged, ...randSel];
  } else {
    // Default fallback: select questions randomly
    selected = shuffle(finalCandidates).slice(0, targetQuestionCount);
  }

  // Ensure unique selection items
  const uniqueSelected = [];
  const seenIds = new Set();
  selected.forEach(q => {
    if (!seenIds.has(q._id.toString())) {
      seenIds.add(q._id.toString());
      uniqueSelected.push(q);
    }
  });

  // If there are still empty spaces, fill them up from finalCandidates
  if (uniqueSelected.length < targetQuestionCount) {
    const remainingCount = targetQuestionCount - uniqueSelected.length;
    const extra = shuffle(finalCandidates.filter(c => !seenIds.has(c._id.toString()))).slice(0, remainingCount);
    uniqueSelected.push(...extra);
  }

  // 5. Build practice session
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

  const session = await PracticeSession.create({
    userId,
    examId,
    phaseId: phaseId || uniqueSelected[0]?.phaseId || '6a4d1b15e3499ec45f8c322c',
    mode,
    durationMinutes,
    requestedQuestionCount: targetQuestionCount,
    generatedQuestionCount: uniqueSelected.length,
    subjectIds,
    topicIds,
    difficultyPreference,
    language,
    sourceFilter,
    questionIds: uniqueSelected.map((q) => q._id),
    expiresAt,
    status: 'created',
  });

  return {
    session,
    warningRepeats,
    questions: uniqueSelected,
  };
};
