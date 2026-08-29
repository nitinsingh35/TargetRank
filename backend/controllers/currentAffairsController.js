import CurrentAffairsPack from '../models/CurrentAffairsPack.js';
import PracticeSession from '../models/PracticeSession.js';
import Question from '../models/Question.js';
import * as packService from '../services/currentAffairsPackService.js';

// 1. GET /api/current-affairs/packs
export const getPacks = async (req, res, next) => {
  try {
    const { examId, phaseId, month, year, category, language } = req.query;
    const filter = { isPublished: true, status: 'published' };

    if (examId) filter.examIds = examId;
    if (phaseId) filter.phaseIds = phaseId;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (category) filter.categories = category;
    if (language) filter.language = language;

    const packs = await CurrentAffairsPack.find(filter)
      .select('title month year language examIds phaseIds categories totalQuestions estimatedPracticeMinutes difficultyMix publishedAt')
      .populate('examIds', 'title')
      .sort({ year: -1, month: -1, publishedAt: -1 })
      .lean();

    // Map attempts status for user
    const packIds = packs.map(p => p._id);
    const userAttempts = await PracticeSession.find({
      userId: req.user._id,
      currentAffairsPackId: { $in: packIds }
    }).select('currentAffairsPackId status score accuracy').lean();

    const attemptMap = {};
    for (const a of userAttempts) {
      // Store best result or active attempt
      const existing = attemptMap[a.currentAffairsPackId.toString()];
      if (!existing || a.status === 'submitted') {
        attemptMap[a.currentAffairsPackId.toString()] = a;
      }
    }

    const mapped = packs.map(p => {
      const attempt = attemptMap[p._id.toString()];
      return {
        ...p,
        attemptStatus: attempt ? attempt.status : 'not_started',
        score: attempt ? attempt.score : null,
        accuracy: attempt ? attempt.accuracy : null,
        activeSessionId: attempt && attempt.status !== 'submitted' ? attempt._id : null
      };
    });

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/current-affairs/packs/:id
export const getPackDetails = async (req, res, next) => {
  try {
    const pack = await CurrentAffairsPack.findOne({
      _id: req.params.id,
      isPublished: true,
      status: 'published'
    })
      .populate('examIds', 'title')
      .populate('phaseIds', 'title')
      .populate('sourceIds', 'title publisherName reliabilityLevel');

    if (!pack) {
      return res.status(404).json({ message: 'Current affairs pack not found.' });
    }

    // Check user practice history on this pack
    const attempt = await PracticeSession.findOne({
      userId: req.user._id,
      currentAffairsPackId: pack._id
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      pack: {
        _id: pack._id,
        title: pack.title,
        description: pack.description,
        month: pack.month,
        year: pack.year,
        language: pack.language,
        examIds: pack.examIds,
        phaseIds: pack.phaseIds,
        categories: pack.categories,
        totalQuestions: pack.questionIds?.length || 0,
        estimatedPracticeMinutes: pack.estimatedPracticeMinutes,
        difficultyMix: pack.difficultyMix,
        sources: pack.sourceIds || []
      },
      attemptStatus: attempt ? attempt.status : 'not_started',
      activeSessionId: attempt && attempt.status !== 'submitted' ? attempt._id : null
    });
  } catch (error) {
    next(error);
  }
};

// 3. POST /api/current-affairs/packs/:id/start-practice
export const startPractice = async (req, res, next) => {
  try {
    const { requestedQuestionCount } = req.body;
    const count = requestedQuestionCount ? Number(requestedQuestionCount) : 20;

    // Check if there is an active session for this pack
    const active = await PracticeSession.findOne({
      userId: req.user._id,
      currentAffairsPackId: req.params.id,
      status: { $in: ['created', 'started'] }
    });

    if (active) {
      // Resume active session
      const questions = await Question.find({ _id: { $in: active.questionIds } })
        .populate('subjectId', 'title')
        .populate('topicId', 'title');

      const stripped = questions.map(q => {
        const qObj = q.toObject();
        delete qObj.correctAnswer;
        delete qObj.correctAnswers;
        delete qObj.explanation;
        delete qObj.explanationHindi;
        return qObj;
      });

      return res.status(200).json({
        success: true,
        message: 'Resuming active practice session.',
        session: active,
        questions: stripped
      });
    }

    const result = await packService.generateCurrentAffairsPractice(
      req.params.id,
      req.user._id,
      count
    );

    res.status(200).json({
      success: true,
      message: 'Current affairs practice started.',
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. GET /api/current-affairs/packs/:id/coverage
export const getPackCategoryCoverage = async (req, res, next) => {
  try {
    const pack = await CurrentAffairsPack.findById(req.params.id);
    if (!pack) {
      return res.status(404).json({ message: 'Pack not found.' });
    }

    const questions = await Question.find({
      _id: { $in: pack.questionIds },
      isPublished: true,
      isVerified: true,
      qualityStatus: 'approved'
    }).select('currentAffairsCategory').lean();

    const categoryMap = {};
    for (const q of questions) {
      const cat = q.currentAffairsCategory || 'miscellaneous';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }

    res.status(200).json({ categories: categoryMap });
  } catch (error) {
    next(error);
  }
};

// 5. GET /api/current-affairs/coverage
export const getGlobalCoverage = async (req, res, next) => {
  try {
    const coverage = await packService.getCurrentAffairsCoverage(req.query);
    res.status(200).json(coverage);
  } catch (error) {
    next(error);
  }
};

// 6. GET /api/current-affairs/my-history
export const getMyHistory = async (req, res, next) => {
  try {
    const { examId, month, year, status } = req.query;
    const filter = {
      userId: req.user._id,
      practiceMode: 'current_affairs'
    };

    if (examId) filter.examId = examId;
    if (month) filter.currentAffairsMonth = Number(month);
    if (year) filter.currentAffairsYear = Number(year);
    if (status) filter.status = status;

    const sessions = await PracticeSession.find(filter)
      .populate('currentAffairsPackId', 'title')
      .populate('examId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = sessions.map(s => ({
      _id: s._id,
      packName: s.currentAffairsPackId?.title || 'Current Affairs Set',
      month: s.currentAffairsMonth,
      year: s.currentAffairsYear,
      examName: s.examId?.title || 'General',
      score: s.score,
      totalMarks: s.totalMarks,
      correct: s.correctCount,
      totalQuestions: s.generatedQuestionCount,
      accuracy: s.accuracy,
      timeTakenSeconds: s.timeTakenSeconds,
      status: s.status,
      createdAt: s.createdAt
    }));

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};
