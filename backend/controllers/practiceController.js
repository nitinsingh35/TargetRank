import PracticeSession from '../models/PracticeSession.js';
import UserQuestionHistory from '../models/UserQuestionHistory.js';
import Question from '../models/Question.js';
import RevisionItem from '../models/RevisionItem.js';
import MistakeNotebook from '../models/MistakeNotebook.js';
import Topic from '../models/Topic.js';

import { selectQuestionsForSession } from '../services/SmartQuestionSelector.js';

// ─── PRACTICE SESSION WORKFLOWS ───

// @desc    Create a smart practice session
// @route   POST /api/practice/create-smart-session
// @access  Private/Aspirant
export const createSmartSession = async (req, res, next) => {
  try {
    const {
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
      subjectId = null,
      topicId = null,
      subtopicId = null,
      questionType = 'all',
      questionCount = null,
    } = req.body;

    // Validate inputs
    if (!examId || !phaseId) {
      return res.status(400).json({ message: 'Exam ID and Phase ID are required.' });
    }

    if (durationMinutes < 5 || durationMinutes > 300) {
      return res.status(400).json({ message: 'Duration must be between 5 and 300 minutes.' });
    }

    const payload = {
      userId: req.user._id,
      examId,
      phaseId,
      mode,
      durationMinutes: Number(durationMinutes) || 30,
      subjectIds: subjectIds.length > 0 ? subjectIds : [],
      topicIds: topicIds.length > 0 ? topicIds : [],
      difficultyPreference,
      language,
      sourceFilter,
      allowRepeats,
      currentAffairsMonth: currentAffairsMonth ? Number(currentAffairsMonth) : null,
      currentAffairsYear: currentAffairsYear ? Number(currentAffairsYear) : null,
      subjectId,
      topicId,
      subtopicId,
      questionType,
      questionCount: questionCount ? Number(questionCount) : null,
    };

    try {
      const { session, warningRepeats, questions } = await selectQuestionsForSession(payload);

      // Strip answers before sending (security requirement)
      const questionsResponse = questions.map((q) => {
        const qObj = q.toObject();
        delete qObj.correctAnswer;
        delete qObj.explanation;
        return qObj;
      });

      res.status(201).json({
        success: true,
        message: questions.length === 0 
          ? 'Practice setup saved. Questions will be selected when the question bank is ready.'
          : 'Practice session generated.',
        session,
        warningRepeats,
        questions: questionsResponse,
      });
    } catch (selectionError) {
      // If question selection fails, still create a basic session with zero questions
      console.error('Question selection error:', selectionError);

      // Get practice config for calculating requested count
      const ExamPracticeConfig = await import('../models/ExamPracticeConfig.js').then(m => m.default).catch(() => null);
      let config = null;
      if (ExamPracticeConfig) {
        config = await ExamPracticeConfig.findOne({ examId }).catch(() => null);
      }

      const defaultMinPerQ = config?.defaultMinutesPerQuestion || 1.5;
      const requestedCount = Math.floor(payload.durationMinutes / defaultMinPerQ);

      // Create session with zero questions
      const expiresAt = new Date(Date.now() + payload.durationMinutes * 60000);
      const session = await PracticeSession.create({
        ...payload,
        requestedQuestionCount: requestedCount,
        generatedQuestionCount: 0,
        questionIds: [],
        expiresAt,
        status: 'created',
      });

      res.status(201).json({
        success: true,
        message: 'Practice setup saved. Questions will be selected when the question bank is ready.',
        session,
        questions: [],
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get session details by ID
// @route   GET /api/practice/sessions/:id
// @access  Private/Aspirant
export const getPracticeSessionDetails = async (req, res, next) => {
  try {
    const session = await PracticeSession.findById(req.params.id)
      .populate('questionIds');

    if (!session) {
      return res.status(404).json({ message: 'Practice session not found.' });
    }

    // Verify ownership
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this session.' });
    }

    const showAnswers = session.status === 'submitted' || session.status === 'expired';

    // Strip answers if not submitted
    const questionsResponse = session.questionIds.map((q) => {
      const qObj = q.toObject();
      if (!showAnswers) {
        delete qObj.correctAnswer;
        delete qObj.explanation;
      }
      return qObj;
    });

    res.status(200).json({
      session,
      questions: questionsResponse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save single practice question answer
// @route   POST /api/practice/sessions/:id/save-answer
// @access  Private/Aspirant
export const savePracticeAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOption } = req.body;
    const session = await PracticeSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Practice session not found.' });
    }

    if (session.status !== 'created' && session.status !== 'started') {
      return res.status(400).json({ message: 'This session is closed.' });
    }

    // Update start status if first save
    if (session.status === 'created') {
      session.status = 'started';
    }

    if (selectedOption === null || selectedOption === undefined) {
      session.answers.delete(questionId);
    } else {
      session.answers.set(questionId, selectedOption);
    }

    await session.save();
    res.status(200).json({ message: 'Response saved.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit practice session and update mistake notebooks
// @route   POST /api/practice/sessions/:id/submit
// @access  Private/Aspirant
export const submitPracticeSession = async (req, res, next) => {
  try {
    const session = await PracticeSession.findById(req.params.id).populate('questionIds');

    if (!session) {
      return res.status(404).json({ message: 'Practice session not found.' });
    }

    if (session.status === 'submitted') {
      return res.status(400).json({ message: 'This practice session is already submitted.' });
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let score = 0;
    const weakTopicsMap = {};

    for (const q of session.questionIds) {
      const qid = q._id.toString();
      const userAns = session.answers.get(qid);

      let resultStatus = 'skipped';

      if (!userAns) {
        skippedCount++;
      } else if (userAns === q.correctAnswer) {
        correctCount++;
        score += q.marks;
        resultStatus = 'correct';
      } else {
        incorrectCount++;
        score -= q.negativeMarks;
        resultStatus = 'incorrect';

        // Track weak topics based on incorrect answers
        const topicName = q.topicId.toString();
        weakTopicsMap[topicName] = (weakTopicsMap[topicName] || 0) + 1;

        // 1. Spaced Repetition Trigger: Add or update RevisionItem
        await RevisionItem.findOneAndUpdate(
          { userId: req.user._id, questionId: q._id },
          {
            examId: q.examId,
            phaseId: q.phaseId,
            subjectId: q.subjectId,
            topicId: q.topicId,
            sourceType: 'wrong_answer',
            status: 'pending',
            nextRevisionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day interval
            $inc: { revisionCount: 1 },
          },
          { upsert: true, new: true }
        );

        // 2. Add to MistakeNotebook
        await MistakeNotebook.findOneAndUpdate(
          { userId: req.user._id, questionId: q._id },
          {
            selectedAnswer: userAns,
            correctAnswer: q.correctAnswer,
            explanationSnapshot: q.explanation || '',
            resolved: false,
          },
          { upsert: true, new: true }
        );
      }

      // Update global Question attempts count
      await Question.findByIdAndUpdate(q._id, {
        $inc: {
          usageCount: 1,
          correctAttemptCount: resultStatus === 'correct' ? 1 : 0,
          incorrectAttemptCount: resultStatus === 'incorrect' ? 1 : 0,
        }
      });

      // Log User Question History
      await UserQuestionHistory.findOneAndUpdate(
        { userId: req.user._id, questionId: q._id },
        {
          examId: q.examId,
          phaseId: q.phaseId,
          subjectId: q.subjectId,
          topicId: q.topicId,
          lastResult: resultStatus,
          lastAttemptedAt: new Date(),
          lastPracticeSessionId: session._id,
          $inc: { attemptCount: 1 },
        },
        { upsert: true }
      );
    }

    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

    // Detect weak topics (topics with >= 2 mistakes)
    const weakTopicsList = Object.keys(weakTopicsMap).filter(topicId => weakTopicsMap[topicId] >= 2);

    session.submittedAt = new Date();
    session.timeTakenSeconds = Math.round((session.submittedAt - session.startedAt) / 1000);
    session.correctCount = correctCount;
    session.incorrectCount = incorrectCount;
    session.skippedCount = skippedCount;
    session.score = Math.max(0, parseFloat(score.toFixed(2)));
    session.accuracy = accuracy;
    session.status = 'submitted';
    session.weakTopicsDetected = weakTopicsList;

    await session.save();

    res.status(200).json({
      message: 'Practice session submitted.',
      session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session results
// @route   GET /api/practice/sessions/:id/result
// @access  Private/Aspirant
export const getPracticeSessionResult = async (req, res, next) => {
  try {
    const session = await PracticeSession.findById(req.params.id)
      .populate({
        path: 'questionIds',
        populate: { path: 'subjectId topicId', select: 'title' }
      })
      .populate('weakTopicsDetected', 'title');

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user practice sessions history
// @route   GET /api/practice/history
// @access  Private/Aspirant
export const getPracticeHistory = async (req, res, next) => {
  try {
    const history = await PracticeSession.find({ userId: req.user._id, status: 'submitted' })
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .sort('-submittedAt');

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart study recommendations and weak topics
// @route   GET /api/practice/recommendations
// @access  Private/Aspirant
export const getPracticeRecommendations = async (req, res, next) => {
  try {
    const mistakes = await MistakeNotebook.find({ userId: req.user._id, resolved: false })
      .populate({
        path: 'questionId',
        populate: { path: 'subjectId topicId', select: 'title' }
      });

    // Group mistakes by Topic to detect weak concepts
    const topicMistakesCount = {};
    const topicDetails = {};

    mistakes.forEach((m) => {
      const q = m.questionId;
      if (q && q.topicId) {
        const tid = q.topicId._id.toString();
        topicMistakesCount[tid] = (topicMistakesCount[tid] || 0) + 1;
        topicDetails[tid] = {
          topicId: q.topicId._id,
          title: q.topicId.title,
          subjectTitle: q.subjectId?.title || 'General Studies',
        };
      }
    });

    const weakTopics = Object.keys(topicMistakesCount)
      .filter((tid) => topicMistakesCount[tid] >= 2)
      .map((tid) => ({
        ...topicDetails[tid],
        mistakeCount: topicMistakesCount[tid],
      }));

    // Formulate study plan suggestions
    const studyPlan = [];
    if (weakTopics.length > 0) {
      studyPlan.push({
        title: `Spaced Revision suggestion: ${weakTopics[0].title}`,
        suggestion: `You have 30 minutes: attempt 15 revision questions in ${weakTopics[0].title} (${weakTopics[0].subjectTitle}) to improve accuracy.`,
        mode: 'weak_topics',
        topicId: weakTopics[0].topicId,
      });
    } else {
      studyPlan.push({
        title: 'Smart Practice suggestion',
        suggestion: 'You have 1 hour: attempt a 30-question smart mixed mock on Indian Polity to keep concepts fresh.',
        mode: 'smart_mixed',
      });
    }

    res.status(200).json({
      weakTopics,
      studyPlan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total count of available questions matching filters
// @route   GET /api/practice/available-question-count
// @access  Private
export const getAvailableQuestionCount = async (req, res, next) => {
  try {
    const {
      examId,
      phaseId,
      subjectId,
      topicId,
      subtopicId,
      subjectIds,
      topicIds,
      questionType,
      difficulty,
      language = 'english',
      sourceFilter = 'all',
      currentAffairsMonth,
      currentAffairsYear,
    } = req.query;

    const query = {
      isPublished: true,
      isArchived: { $ne: true }
    };

    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    
    if (subjectId) query.subjectId = subjectId;
    const subList = Array.isArray(subjectIds) ? subjectIds : (subjectIds ? subjectIds.split(',').filter(Boolean) : []);
    if (subList.length > 0) query.subjectId = { $in: subList };

    if (topicId) query.topicId = topicId;
    const topList = Array.isArray(topicIds) ? topicIds : (topicIds ? topicIds.split(',').filter(Boolean) : []);
    if (topList.length > 0) query.topicId = { $in: topList };

    if (subtopicId) query.subtopicId = subtopicId;

    if (questionType && questionType !== 'all') {
      query.questionType = questionType;
    }

    if (language && language !== 'all') {
      query.language = language;
    }

    if (difficulty && difficulty !== 'mixed') {
      query.difficulty = difficulty;
    }

    // Source filters
    if (sourceFilter === 'official_pyq' || sourceFilter === 'previous_year' || sourceFilter === 'pyq_only') {
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
      const user = await User.findById(req.user._id).select('bookmarks').lean();
      const bIds = (user?.bookmarks || []).map(id => id.toString());
      query._id = { $in: bIds };
    } else if (sourceFilter === 'mistake_notebook' || sourceFilter === 'weak_topics') {
      const mistakes = await MistakeNotebook.find({ userId: req.user._id, resolved: false }).select('questionId').lean();
      const mIds = mistakes.map(m => m.questionId.toString());
      query._id = { $in: mIds };
    }

    const total = await Question.countDocuments(query);
    
    // PYQs count under this query context
    const pyqQuery = { ...query };
    delete pyqQuery.$or;
    pyqQuery.$or = [
      { isPreviousYearQuestion: true },
      { sourceType: { $in: ['official_pyq', 'verified_previous_year', 'previous_year'] } }
    ];
    const pyqs = await Question.countDocuments(pyqQuery);

    // Important count under this query context
    const impQuery = { ...query };
    impQuery.importanceLevel = { $in: ['important', 'very_important', 'high_frequency', 'must_do'] };
    const important = await Question.countDocuments(impQuery);

    res.status(200).json({
      total,
      pyqs,
      important,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Abandon a practice session
// @route   POST /api/practice/sessions/:id/abandon
// @access  Private/Aspirant
export const abandonPracticeSession = async (req, res, next) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.status = 'abandoned';
    await session.save();
    res.status(200).json({ message: 'Session abandoned.' });
  } catch (error) {
    next(error);
  }
};

// ─── NEW PHASE 5 APIS ───

// @desc    Get practice configuration for an exam
// @route   GET /api/practice/config/:examId/:phaseId
// @access  Public
export const getPracticeConfig = async (req, res, next) => {
  try {
    const { examId, phaseId } = req.params;
    
    // Try to find existing config
    let ExamPracticeConfig;
    try {
      ExamPracticeConfig = await import('../models/ExamPracticeConfig.js').then(m => m.default);
    } catch (e) {
      // ExamPracticeConfig model not available, use defaults
    }

    let config = null;
    if (ExamPracticeConfig) {
      config = await ExamPracticeConfig.findOne({ examId });
    }

    // Return config or safe defaults
    const result = config ? {
      defaultMinutesPerQuestion: config.defaultMinutesPerQuestion || 1.5,
      defaultMarksPerQuestion: config.defaultMarksPerQuestion || 2,
      defaultNegativeMarks: config.defaultNegativeMarks || 0.66,
      fullMockDurationMinutes: config.fullMockDurationMinutes || 120,
      fullMockQuestionCount: config.fullMockQuestionCount || 100,
    } : {
      defaultMinutesPerQuestion: 1.5,
      defaultMarksPerQuestion: 2,
      defaultNegativeMarks: 0.66,
      fullMockDurationMinutes: 120,
      fullMockQuestionCount: 100,
    };

    res.status(200).json({
      success: true,
      config: result,
    });
  } catch (error) {
    // Return safe defaults even on error
    res.status(200).json({
      success: true,
      config: {
        defaultMinutesPerQuestion: 1.5,
        defaultMarksPerQuestion: 2,
        defaultNegativeMarks: 0.66,
        fullMockDurationMinutes: 120,
        fullMockQuestionCount: 100,
      },
    });
  }
};

// @desc    Get user's saved practice setups (all statuses, not just submitted)
// @route   GET /api/practice/my-sessions
// @access  Private/Aspirant
export const getMyPracticeSessions = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await PracticeSession.find({ userId: req.user._id })
      .populate('examId', 'title slug')
      .populate('phaseId', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PracticeSession.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a practice session (only created or abandoned)
// @route   DELETE /api/practice/sessions/:id
// @access  Private/Aspirant
export const deletePracticeSession = async (req, res, next) => {
  try {
    const session = await PracticeSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Verify ownership
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this session.' });
    }

    // Only allow deletion of created or abandoned sessions
    if (!['created', 'abandoned'].includes(session.status)) {
      return res.status(400).json({ 
        message: 'Cannot delete submitted or in-progress sessions.' 
      });
    }

    await PracticeSession.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Practice session deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enhance: Get available question count with safe defaults
// @route   GET /api/practice/available-question-count
// @access  Private
export const getAvailableQuestionCountEnhanced = async (req, res, next) => {
  try {
    const { 
      examId, 
      phaseId, 
      subjectId,
      topicId,
      subtopicId,
      subjectIds = [], 
      topicIds = [], 
      difficulty = 'mixed',
      language = 'english',
      sourceFilter = 'all',
      questionType,
      currentAffairsMonth,
      currentAffairsYear,
    } = req.query;

    const query = {
      isPublished: true,
      isArchived: { $ne: true }
    };
    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    
    if (subjectId) query.subjectId = subjectId;
    const subList = Array.isArray(subjectIds) ? subjectIds : (subjectIds ? subjectIds.split(',').filter(Boolean) : []);
    if (subList.length > 0) query.subjectId = { $in: subList };

    if (topicId) query.topicId = topicId;
    const topList = Array.isArray(topicIds) ? topicIds : (topicIds ? topicIds.split(',').filter(Boolean) : []);
    if (topList.length > 0) query.topicId = { $in: topList };

    if (subtopicId) query.subtopicId = subtopicId;

    if (questionType && questionType !== 'all') {
      query.questionType = questionType;
    }

    if (language && language !== 'all') {
      query.language = language;
    }

    if (difficulty && difficulty !== 'mixed') {
      query.difficulty = difficulty;
    }

    // Source filters
    if (sourceFilter === 'official_pyq' || sourceFilter === 'previous_year' || sourceFilter === 'pyq_only') {
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
    } else if (sourceFilter === 'important' || sourceFilter === 'pyq_important') {
      query.$or = [
        { importanceLevel: { $in: ['important', 'very_important', 'high_frequency', 'must_do'] } },
        { sourceType: 'verified_previous_year' }
      ];
    } else if (sourceFilter === 'bookmarked') {
      const user = await User.findById(req.user._id).select('bookmarks').lean();
      const bIds = (user?.bookmarks || []).map(id => id.toString());
      query._id = { $in: bIds };
    } else if (sourceFilter === 'mistake_notebook' || sourceFilter === 'weak_topics') {
      const mistakes = await MistakeNotebook.find({ userId: req.user._id, resolved: false }).select('questionId').lean();
      const mIds = mistakes.map(m => m.questionId.toString());
      query._id = { $in: mIds };
    }

    const count = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      availableQuestionCount: count,
      message: count === 0 ? 'Questions will be added soon.' : `${count} questions available.`,
    });
  } catch (error) {
    // Return safe response even on error
    res.status(200).json({
      success: true,
      availableQuestionCount: 0,
      message: 'Questions will be added soon.',
    });
  }
};
