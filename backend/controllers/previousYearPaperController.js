import PreviousYearPaper from '../models/PreviousYearPaper.js';
import PaperAttempt     from '../models/PaperAttempt.js';
import Question         from '../models/Question.js';
import User             from '../models/User.js';
import { calculatePaperResult } from '../services/paperResultService.js';

// ─── helpers ──────────────────────────────────────────────────────────────────
const paginate = (req) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

// ─── 1. GET /api/previous-year-papers ─────────────────────────────────────────
// @desc  Browse published PYQ papers with attempt status for logged-in user
// @route GET /api/previous-year-papers
// @access Private
export const getPublishedPapers = async (req, res, next) => {
  try {
    const { examId, phaseId, year, paperType, language } = req.query;
    const filter = { isPublished: true };

    if (examId)    filter.examId = examId;
    if (phaseId)   filter.phaseId = phaseId;
    if (year)      filter.year = Number(year);
    if (paperType) filter.paperType = paperType;
    if (language)  filter.language = language;

    const { page, limit, skip } = paginate(req);

    const [papers, total] = await Promise.all([
      PreviousYearPaper.find(filter)
        .populate('examId', 'title')
        .populate('phaseId', 'title')
        .sort('-year -createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      PreviousYearPaper.countDocuments(filter),
    ]);

    // Fetch user attempts to calculate status and summaries
    const paperIds = papers.map(p => p._id);
    const attempts = await PaperAttempt.find({
      userId: req.user._id,
      paperId: { $in: paperIds },
    }).sort('-createdAt').lean();

    // Map attempts by Paper ID
    const attemptsMap = new Map();
    attempts.forEach(att => {
      const pId = att.paperId.toString();
      if (!attemptsMap.has(pId)) {
        attemptsMap.set(pId, []);
      }
      attemptsMap.get(pId).push(att);
    });

    const enrichedPapers = papers.map(paper => {
      const pIdStr = paper._id.toString();
      const userAttempts = attemptsMap.get(pIdStr) || [];
      
      let attemptStatus = 'not_started';
      let latestResultSummary = null;

      if (userAttempts.length > 0) {
        const latest = userAttempts[0];
        attemptStatus = latest.status;

        // Find latest completed/expired attempt for result summary
        const latestSubmitted = userAttempts.find(
          att => att.status === 'submitted' || att.status === 'expired'
        );
        if (latestSubmitted) {
          latestResultSummary = {
            attemptId: latestSubmitted._id,
            score: latestSubmitted.score,
            totalMarks: latestSubmitted.totalMarks,
            correctCount: latestSubmitted.correctCount,
            incorrectCount: latestSubmitted.incorrectCount,
            accuracy: latestSubmitted.accuracy,
            submittedAt: latestSubmitted.submittedAt || latestSubmitted.updatedAt,
          };
        }
      }

      return {
        ...paper,
        attemptStatus,
        latestResultSummary,
      };
    });

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      papers: enrichedPapers,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. GET /api/previous-year-papers/:id ─────────────────────────────────────
// @desc  Get paper metadata details (hides correctAnswers and explanations)
// @route GET /api/previous-year-papers/:id
// @access Private
export const getPaperDetails = async (req, res, next) => {
  try {
    const paper = await PreviousYearPaper.findOne({
      _id: req.params.id,
      isPublished: true,
    })
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .populate({
        path: 'questionIds',
        select: '-correctAnswer -explanation', // Hide key info before submission
      })
      .lean();

    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found or unpublished.' });
    }

    res.status(200).json({
      success: true,
      paper,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. POST /api/previous-year-papers/:id/start ──────────────────────────────
// @desc  Start attempt on a paper
// @route POST /api/previous-year-papers/:id/start
// @access Private
export const startPaperAttempt = async (req, res, next) => {
  try {
    const paper = await PreviousYearPaper.findOne({
      _id: req.params.id,
      isPublished: true,
    });

    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found.' });
    }

    if (!paper.questionIds || paper.questionIds.length === 0) {
      return res.status(400).json({
        message: 'This paper does not contain any questions. Please contact administrator.',
      });
    }

    // Check duplicate active attempt
    let activeAttempt = await PaperAttempt.findOne({
      userId: req.user._id,
      paperId: paper._id,
      status: { $in: ['created', 'started'] },
    });

    if (activeAttempt) {
      const dbQuestions = await Question.find({ _id: { $in: paper.questionIds } })
        .select('-correctAnswer -explanation')
        .lean();
      const snapshotMap = new Map(
        (activeAttempt.questionSnapshot || []).map(q => [q.questionId.toString(), q])
      );

      const questions = paper.questionIds.map((qId) => {
        const qIdStr = qId.toString();
        const dbQuestion = dbQuestions.find(q => q._id.toString() === qIdStr);
        if (dbQuestion) return dbQuestion;
        const snap = snapshotMap.get(qIdStr);
        if (!snap) return null;
        const { questionId, correctAnswer, explanation, correctAnswers, ...safeFields } = snap;
        return { _id: questionId, ...safeFields };
      }).filter(Boolean);

      return res.status(200).json({
        success: true,
        message: 'Active attempt already exists. Resuming session.',
        attempt: activeAttempt,
        questions,
      });
    }

    // Load the question definitions for snapshot preservation
    const questionDocs = await Question.find({ _id: { $in: paper.questionIds } }).lean();
    const questionSnapshot = questionDocs.map((q) => ({
      questionId: q._id,
      questionType: q.questionType,
      questionText: q.questionText,
      questionHindi: q.questionHindi,
      options: q.options,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      difficulty: q.difficulty,
      language: q.language,
      subjectId: q.subjectId,
      topicId: q.topicId,
      subtopicId: q.subtopicId,
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation,
      explanationHindi: q.explanationHindi,
      sourceType: q.sourceType,
      sourceName: q.sourceName,
      sourceUrl: q.sourceUrl,
      sourceYear: q.sourceYear,
      paperName: q.paperName,
      paperCode: q.paperCode,
    }));

    // Create new attempt
    const durationMs = paper.durationMinutes * 60 * 1000;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMs);

    // Pre-populate empty answers layout matching paper questions
    const answersLayout = paper.questionIds.map(qId => ({
      questionId: qId,
      selectedAnswer: null,
      isMarkedForReview: false,
      visited: false,
      timeSpentSeconds: 0,
      savedAt: now,
    }));

    const attempt = await PaperAttempt.create({
      userId: req.user._id,
      paperId: paper._id,
      status: 'started',
      startedAt: now,
      expiresAt,
      answers: answersLayout,
      totalMarks: paper.totalMarks,
      questionSnapshot,
    });

    const questions = questionDocs.map(q => {
      const { correctAnswer, explanation, ...rest } = q;
      return rest;
    });

    res.status(201).json({
      success: true,
      message: 'Practice paper attempt started.',
      attempt,
      questions,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. GET /api/previous-year-papers/attempts/:attemptId ─────────────────────
// @desc  Resume attempt from active layout (auto-submits if expired)
// @route GET /api/previous-year-papers/attempts/:attemptId
// @access Private
export const resumeAttempt = async (req, res, next) => {
  try {
    const attempt = await PaperAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt session not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to attempt.' });
    }

    if (!['created', 'started'].includes(attempt.status)) {
      return res.status(400).json({
        message: 'Cannot resume attempt. Attempt has already been submitted or completed.',
        status: attempt.status,
      });
    }

    // Check expiration
    const now = new Date();
    if (now > attempt.expiresAt) {
      // Auto-submit immediately
      attempt.status = 'expired';
      attempt.autoSubmitted = true;
      attempt.submittedAt = now;
      attempt.timeTakenSeconds = Math.max(
        0,
        Math.round((attempt.expiresAt.getTime() - attempt.startedAt.getTime()) / 1000)
      );

      const metrics = await calculatePaperResult(attempt);
      Object.assign(attempt, metrics);
      attempt.resultGenerated = true;
      await attempt.save();

      return res.status(200).json({
        success: true,
        message: 'Attempt timer expired. Session auto-submitted.',
        attempt,
        expired: true,
      });
    }

    // Get paper definition questions
    const paper = await PreviousYearPaper.findById(attempt.paperId);
    const dbQuestions = await Question.find({ _id: { $in: paper.questionIds } })
      .select('-correctAnswer -explanation')
      .lean();

    const snapshotMap = new Map(
      (attempt.questionSnapshot || []).map(q => [q.questionId.toString(), q])
    );

    const questions = paper.questionIds.map((qId) => {
      const qIdStr = qId.toString();
      const dbQuestion = dbQuestions.find(q => q._id.toString() === qIdStr);
      if (dbQuestion) return dbQuestion;
      const snap = snapshotMap.get(qIdStr);
      if (!snap) return null;
      const { questionId, correctAnswer, explanation, correctAnswers, ...safeFields } = snap;
      return { _id: questionId, ...safeFields };
    }).filter(Boolean);

    const remainingSeconds = Math.max(0, Math.round((attempt.expiresAt.getTime() - Date.now()) / 1000));

    res.status(200).json({
      success: true,
      attempt,
      questions,
      remainingSeconds,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 5. POST /api/previous-year-papers/attempts/:attemptId/save-answer ────────
// @desc  Save question response progress
// @route POST /api/previous-year-papers/attempts/:attemptId/save-answer
// @access Private
export const saveAttemptAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedAnswer, isMarkedForReview, timeSpentSeconds, currentQuestionIndex } = req.body;

    const attempt = await PaperAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt session not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (attempt.status !== 'started') {
      return res.status(400).json({ message: 'Session is not active.', status: attempt.status });
    }

    // Check expiration
    if (new Date() > attempt.expiresAt) {
      return res.status(400).json({ message: 'Test duration expired. Save block active.' });
    }

    // Match question ID in pre-populated answers layout
    const ansItem = attempt.answers.find(a => a.questionId.toString() === questionId);
    if (!ansItem) {
      return res.status(400).json({ message: 'Question does not belong to this paper.' });
    }

    // Validate option if selection provided
    if (selectedAnswer) {
      const q = await Question.findById(questionId).select('options').lean();
      let validOptions = q?.options || [];
      if (!q) {
        const snapshotQ = (attempt.questionSnapshot || []).find(q => q.questionId.toString() === questionId);
        validOptions = snapshotQ?.options || [];
      }
      if (validOptions.length > 0 && !validOptions.includes(selectedAnswer)) {
        return res.status(400).json({ message: 'Invalid option selected.' });
      }
    }

    ansItem.selectedAnswer   = selectedAnswer === '' ? null : selectedAnswer;
    ansItem.visited          = true;
    ansItem.savedAt          = new Date();
    
    if (isMarkedForReview !== undefined) {
      ansItem.isMarkedForReview = !!isMarkedForReview;
    }
    if (timeSpentSeconds !== undefined) {
      ansItem.timeSpentSeconds += Number(timeSpentSeconds);
    }

    if (currentQuestionIndex !== undefined) {
      attempt.currentQuestionIndex = Math.max(0, Number(currentQuestionIndex));
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Response progress saved.',
      attempt,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6. POST /api/previous-year-papers/attempts/:attemptId/mark-review ────────
// @desc  Toggle review marker state
// @route POST /api/previous-year-papers/attempts/:attemptId/mark-review
// @access Private
export const toggleAttemptReview = async (req, res, next) => {
  try {
    const { questionId, isMarkedForReview } = req.body;

    const attempt = await PaperAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (attempt.status !== 'started') {
      return res.status(400).json({ message: 'Session is inactive.' });
    }

    const ansItem = attempt.answers.find(a => a.questionId.toString() === questionId);
    if (!ansItem) {
      return res.status(400).json({ message: 'Question not found in paper attempt.' });
    }

    ansItem.isMarkedForReview = !!isMarkedForReview;
    ansItem.visited = true;
    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Question review status toggled.',
      attempt,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 7. POST /api/previous-year-papers/attempts/:attemptId/submit ──────────────
// @desc  Submit attempt and compute results
// @route POST /api/previous-year-papers/attempts/:attemptId/submit
// @access Private
export const submitPaperAttempt = async (req, res, next) => {
  try {
    const attempt = await PaperAttempt.findById(req.params.attemptId);

    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Paper already submitted.' });
    }

    const now = new Date();
    attempt.status = 'submitted';
    attempt.submittedAt = now;
    attempt.timeTakenSeconds = Math.max(
      0,
      Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000)
    );

    const metrics = await calculatePaperResult(attempt);
    Object.assign(attempt, metrics);
    attempt.resultGenerated = true;

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Paper attempt submitted successfully.',
      resultSummary: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        skippedCount: attempt.skippedCount,
        accuracy: attempt.accuracy,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 8. POST /api/previous-year-papers/attempts/:attemptId/auto-submit ─────────
// @desc  Auto-submit expired attempt on duration end
// @route POST /api/previous-year-papers/attempts/:attemptId/auto-submit
// @access Private
export const autoSubmitPaperAttempt = async (req, res, next) => {
  try {
    const attempt = await PaperAttempt.findById(req.params.attemptId);

    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Paper already submitted.' });
    }

    const now = new Date();
    // Validate expiration with 15 seconds grace allowance
    const graceTime = new Date(attempt.expiresAt.getTime() - 15000);
    if (now <= graceTime) {
      return res.status(400).json({ message: 'Auto-submit blocked. Time has not expired yet.' });
    }

    attempt.status = 'expired';
    attempt.autoSubmitted = true;
    attempt.submittedAt = now;
    attempt.timeTakenSeconds = Math.max(
      0,
      Math.round((attempt.expiresAt.getTime() - attempt.startedAt.getTime()) / 1000)
    );

    const metrics = await calculatePaperResult(attempt);
    Object.assign(attempt, metrics);
    attempt.resultGenerated = true;

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Paper attempt auto-submitted successfully.',
      resultSummary: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        skippedCount: attempt.skippedCount,
        accuracy: attempt.accuracy,
        autoSubmitted: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 9. GET /api/previous-year-papers/attempts/:attemptId/result ───────────────
// @desc  Get attempt result dashboard (reveals correct answers + explanations)
// @route GET /api/previous-year-papers/attempts/:attemptId/result
// @access Private
export const getAttemptResult = async (req, res, next) => {
  try {
    const attempt = await PaperAttempt.findById(req.params.attemptId);

    if (!attempt) return res.status(404).json({ message: 'Attempt session not found.' });
    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (!['submitted', 'expired'].includes(attempt.status)) {
      return res.status(400).json({
        message: 'Results are not available. Attempt must be submitted or expired first.',
      });
    }

    const paper = await PreviousYearPaper.findById(attempt.paperId);
    if (!paper) return res.status(404).json({ message: 'Paper not found.' });

    // Load fully populated question review lists
    const questions = await Question.find({ _id: { $in: paper.questionIds } })
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();

    const snapshotMap = new Map(
      (attempt.questionSnapshot || []).map(q => [q.questionId.toString(), q])
    );
    const questionsMap = new Map(questions.map(q => [q._id.toString(), q]));
    const answersMap = new Map(attempt.answers.map(ans => [ans.questionId.toString(), ans]));

    // Fetch user's bookmarks list to check bookmark status
    const user = await User.findById(req.user._id).select('bookmarks').lean();
    const userBookmarks = new Set((user?.bookmarks || []).map(id => id.toString()));

    const reviewedQuestions = paper.questionIds.map((qId, idx) => {
      const qIdStr = qId.toString();
      let question = questionsMap.get(qIdStr);
      if (!question) {
        const snapshot = snapshotMap.get(qIdStr);
        if (snapshot) {
          question = {
            ...snapshot,
            subjectId: { _id: snapshot.subjectId, title: snapshot.subjectId?.title || 'General' },
            topicId: { _id: snapshot.topicId, title: snapshot.topicId?.title || 'Concept' },
          };
        }
      }
      const userAnsObj = answersMap.get(qIdStr);

      const selectedAnswer = userAnsObj?.selectedAnswer || null;
      const correctAnswer = question?.correctAnswer || '';
      
      let status = 'skipped';
      if (selectedAnswer) {
        status = selectedAnswer === correctAnswer ? 'correct' : 'incorrect';
      }

      return {
        questionId:    qIdStr,
        questionText:  question?.questionText || '',
        options:       question?.options || [],
        selectedAnswer,
        correctAnswer,
        explanation:   question?.explanation || '',
        marks:         question?.marks || 2,
        negativeMarks: question?.negativeMarks || 0.66,
        subject:       question?.subjectId?.title || 'General',
        topic:         question?.topicId?.title   || 'Concept',
        status,
        isBookmarked:  userBookmarks.has(qIdStr),
      };
    });

    res.status(200).json({
      success: true,
      attempt: {
        _id: attempt._id,
        paperId: attempt.paperId,
        paperTitle: paper.title,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        autoSubmitted: attempt.autoSubmitted,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        skippedCount: attempt.skippedCount,
        accuracy: attempt.accuracy,
        timeTakenSeconds: attempt.timeTakenSeconds,
        sectionPerformance: attempt.sectionPerformance,
        subjectPerformance: attempt.subjectPerformance,
        topicPerformance: attempt.topicPerformance,
      },
      reviewedQuestions,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 10. GET /api/previous-year-papers/attempt-history ────────────────────────
// @desc  Get user attempts history list (paginated)
// @route GET /api/previous-year-papers/attempt-history
// @access Private
export const getAttemptHistory = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };

    if (req.query.examId) {
      // Find papers associated to this exam to filter attempts
      const papers = await PreviousYearPaper.find({ examId: req.query.examId }).select('_id').lean();
      filter.paperId = { $in: papers.map(p => p._id) };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by year or paperType of the paper
    if (req.query.year || req.query.paperType) {
      const paperFilter = {};
      if (req.query.year) paperFilter.year = Number(req.query.year);
      if (req.query.paperType) paperFilter.paperType = req.query.paperType;

      const matchedPapers = await PreviousYearPaper.find(paperFilter).select('_id').lean();
      
      // Merge with existing paperId filter if exists
      const matchedPaperIds = matchedPapers.map(p => p._id.toString());
      if (filter.paperId) {
        const existingIds = filter.paperId.$in.map(id => id.toString());
        const intersection = matchedPaperIds.filter(id => existingIds.includes(id));
        filter.paperId = { $in: intersection };
      } else {
        filter.paperId = { $in: matchedPaperIds };
      }
    }

    const { page, limit, skip } = paginate(req);

    const [attempts, total] = await Promise.all([
      PaperAttempt.find(filter)
        .populate({
          path: 'paperId',
          select: 'title year paperType durationMinutes totalQuestions totalMarks examId phaseId',
          populate: [
            { path: 'examId', select: 'title' },
            { path: 'phaseId', select: 'title' }
          ]
        })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      PaperAttempt.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      attempts,
    });
  } catch (err) {
    next(err);
  }
};
