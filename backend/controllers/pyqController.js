import PYQPaper from '../models/PYQPaper.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Bookmark from '../models/Bookmark.js';
import * as pyqSimulatorService from '../services/pyqPaperSimulatorService.js';

// 1. GET /api/pyq-papers
export const getPublishedPYQPapers = async (req, res, next) => {
  try {
    const { examId, phaseId, year, paperType, language } = req.query;
    const filter = {
      isPublished: true,
      status: 'published',
      sourceVerified: true,
    };

    if (examId) filter.examId = examId;
    if (phaseId) filter.phaseId = phaseId;
    if (year) filter.year = Number(year);
    if (paperType) filter.paperType = paperType;
    if (language) filter.language = language;

    const papers = await PYQPaper.find(filter)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .sort({ year: -1, createdAt: -1 })
      .lean();

    res.status(200).json(papers);
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/pyq-papers/:id
export const getPYQPaperDetails = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findOne({
      _id: req.params.id,
      isPublished: true,
      status: 'published',
    })
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .lean();

    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found or unavailable.' });
    }

    // Load attempt count for this student
    const completedAttemptsCount = await MockTestAttempt.countDocuments({
      userId: req.user._id,
      pyqPaperId: paper._id,
      status: 'submitted',
    });

    const activeAttempt = await MockTestAttempt.findOne({
      userId: req.user._id,
      pyqPaperId: paper._id,
      status: { $in: ['created', 'started'] },
    }).select('_id status expiresAt');

    res.status(200).json({
      paper: {
        _id: paper._id,
        title: paper.title,
        examId: paper.examId,
        phaseId: paper.phaseId,
        year: paper.year,
        paperName: paper.paperName,
        paperCode: paper.paperCode,
        paperType: paper.paperType,
        language: paper.language,
        durationMinutes: paper.durationMinutes,
        totalQuestions: paper.totalQuestions,
        totalMarks: paper.totalMarks,
        negativeMarkingEnabled: paper.negativeMarkingEnabled,
        defaultNegativeMarks: paper.defaultNegativeMarks,
        officialSourceName: paper.officialSourceName,
        officialSourceUrl: paper.officialSourceUrl,
        officialAnswerKeyUrl: paper.officialAnswerKeyUrl,
        instructions: paper.instructions,
        instructionsHindi: paper.instructionsHindi,
        attemptLimit: paper.attemptLimit,
      },
      attemptStatus: {
        completedAttemptsCount,
        hasActiveAttempt: !!activeAttempt,
        activeAttemptId: activeAttempt ? activeAttempt._id : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. POST /api/pyq-papers/:id/start
export const startPYQAttempt = async (req, res, next) => {
  try {
    const result = await pyqSimulatorService.createPYQAttempt(req.params.id, req.user._id);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. GET /api/pyq-papers/attempts/:attemptId
export const resumePYQAttempt = async (req, res, next) => {
  try {
    const result = await pyqSimulatorService.getPYQAttempt(req.params.attemptId, req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 5. POST /api/pyq-papers/attempts/:attemptId/save-answer
export const savePYQAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedAnswer, timeSpentSeconds, currentQuestionIndex } = req.body;
    
    await pyqSimulatorService.savePYQAnswer(req.params.attemptId, req.user._id, {
      questionId,
      selectedAnswer,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      currentQuestionIndex: Number(currentQuestionIndex) || 0,
    });

    res.status(200).json({ success: true, message: 'Progress saved successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 6. POST /api/pyq-papers/attempts/:attemptId/mark-review
export const markPYQReview = async (req, res, next) => {
  try {
    const { questionId, isMarkedForReview } = req.body;
    const attempt = await MockTestAttempt.findOne({ _id: req.params.attemptId, userId: req.user._id });

    if (!attempt || attempt.status !== 'started') {
      return res.status(400).json({ message: 'Session is inactive or not found.' });
    }

    const questionEntry = attempt.questions.find(q => q.questionId.toString() === questionId.toString());
    if (!questionEntry) {
      return res.status(400).json({ message: 'Question does not belong to this attempt.' });
    }

    questionEntry.isMarkedForReview = !!isMarkedForReview;
    questionEntry.visited = true;
    await attempt.save();

    res.status(200).json({ success: true, isMarkedForReview: questionEntry.isMarkedForReview });
  } catch (error) {
    next(error);
  }
};

// 7. POST /api/pyq-papers/attempts/:attemptId/bookmark
export const togglePYQBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.body;
    const attempt = await MockTestAttempt.findOne({ _id: req.params.attemptId, userId: req.user._id });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    const questionEntry = attempt.questions.find(q => q.questionId.toString() === questionId.toString());
    if (!questionEntry) {
      return res.status(400).json({ message: 'Question does not belong to this attempt.' });
    }

    const existingBookmark = await Bookmark.findOne({ userId: req.user._id, questionId });

    let isBookmarked = false;
    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      isBookmarked = false;
    } else {
      await Bookmark.create({
        userId: req.user._id,
        questionId,
        examId: attempt.examId,
        phaseId: attempt.phaseId,
      });
      isBookmarked = true;
    }

    questionEntry.isBookmarked = isBookmarked;
    await attempt.save();

    res.status(200).json({ success: true, isBookmarked });
  } catch (error) {
    next(error);
  }
};

// 8. POST /api/pyq-papers/attempts/:attemptId/submit
export const submitPYQAttempt = async (req, res, next) => {
  try {
    const attempt = await pyqSimulatorService.submitPYQAttempt(req.params.attemptId, req.user._id, false);
    res.status(200).json({ success: true, message: 'PYQ paper attempt graded successfully.', attemptId: attempt._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 9. POST /api/pyq-papers/attempts/:attemptId/auto-submit
export const autoSubmitPYQAttempt = async (req, res, next) => {
  try {
    const attempt = await pyqSimulatorService.submitPYQAttempt(req.params.attemptId, req.user._id, true);
    res.status(200).json({ success: true, message: 'PYQ paper attempt auto-submitted successfully.', attemptId: attempt._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 10. GET /api/pyq-papers/attempts/:attemptId/result
export const getPYQResult = async (req, res, next) => {
  try {
    const result = await pyqSimulatorService.getPYQResult(req.params.attemptId, req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 11. GET /api/pyq-papers/my-attempts
export const getMyAttempts = async (req, res, next) => {
  try {
    const { examId, year, page = 1, limit = 15 } = req.query;
    const filter = { userId: req.user._id, attemptCategory: 'pyq_paper' };
    if (examId) filter.examId = examId;
    if (year) filter['pyqMeta.year'] = Number(year);

    const skip = (Number(page) - 1) * Number(limit);
    const [attempts, total] = await Promise.all([
      MockTestAttempt.find(filter)
        .populate('examId', 'title')
        .populate('pyqPaperId', 'title paperName year paperType language durationMinutes totalQuestions totalMarks')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MockTestAttempt.countDocuments(filter),
    ]);

    // Flatten pyqPaperId metadata onto each attempt for easier frontend consumption
    const mapped = attempts.map(a => ({
      _id: a._id,
      status: a.status,
      createdAt: a.createdAt,
      submittedAt: a.submittedAt,
      scorePercentage: a.scorePercentage,
      score: a.score,
      correct: a.correctCount,
      wrong: a.incorrectCount,
      skipped: a.skippedCount,
      timeTakenMinutes: a.timeTakenMinutes,
      totalQuestions: a.totalQuestions,
      paperTitle: a.pyqPaperId?.title || a.pyqMeta?.paperName || '—',
      examTitle: a.examId?.title || a.pyqMeta?.examTitle || '—',
      year: a.pyqPaperId?.year || a.pyqMeta?.year,
      paperType: a.pyqPaperId?.paperType,
      pyqPaperId: a.pyqPaperId?._id || a.pyqPaperId,
    }));

    res.status(200).json({
      success: true,
      attempts: mapped,
      total,
      page: Number(page),
      hasMore: skip + attempts.length < total,
    });
  } catch (error) {
    next(error);
  }
};

// 12. GET /api/pyq-papers/my-comparison
export const getMyComparison = async (req, res, next) => {
  try {
    const { examId, phaseId } = req.query;
    // examId is optional; null = all exams
    const comparison = await pyqSimulatorService.getPYQComparison(
      req.user._id,
      examId || null,
      phaseId || null,
    );
    res.status(200).json({ success: true, ...comparison });
  } catch (error) {
    next(error);
  }
};
