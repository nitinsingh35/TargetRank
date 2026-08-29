import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Question from '../models/Question.js';
import Bookmark from '../models/Bookmark.js';
import { generateMockQuestions, calculateMockResult } from '../services/mockTestGeneratorService.js';
import mongoose from 'mongoose';

// 1. GET /api/mock-tests (List published mock tests)
export const getPublishedMockTests = async (req, res, next) => {
  try {
    const { examId, phaseId, category, language, isPremium, statusFilter } = req.query;
    const query = { status: 'published' }; // Only published mock tests are available for aspirants

    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    if (category) query.category = category;
    if (language) query.language = language;
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';

    // Date range filter
    const now = new Date();
    if (statusFilter === 'upcoming') {
      query.availableFrom = { $gt: now };
    } else if (statusFilter === 'active') {
      query.$or = [
        { availableFrom: { $exists: false } },
        { availableFrom: null },
        { availableFrom: { $lte: now } }
      ];
      query.$and = [
        {
          $or: [
            { availableUntil: { $exists: false } },
            { availableUntil: null },
            { availableUntil: { $gte: now } }
          ]
        }
      ];
    }

    const mockTests = await MockTest.find(query)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .sort('-createdAt')
      .lean();

    // Map attempt status/limit for this specific user
    const testsWithAttemptInfo = await Promise.all(
      mockTests.map(async (test) => {
        const attempts = await MockTestAttempt.find({
          userId: req.user._id,
          mockTestId: test._id
        }).select('status score accuracy startedAt submittedAt').sort('-createdAt').lean();

        const startedAttempt = attempts.find(a => ['created', 'started'].includes(a.status));
        const completedAttempts = attempts.filter(a => a.status === 'submitted');

        return {
          ...test,
          userAttemptsCount: completedAttempts.length,
          hasActiveAttempt: !!startedAttempt,
          activeAttemptId: startedAttempt?._id || null,
          isAttemptLimitReached: completedAttempts.length >= (test.attemptLimit || 1),
          lastAttemptScore: completedAttempts[0]?.score || null,
          lastAttemptAccuracy: completedAttempts[0]?.accuracy || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      mockTests: testsWithAttemptInfo,
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/mock-tests/:id (Mock test details)
export const getMockTestDetails = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .lean();

    if (!mockTest || mockTest.status !== 'published') {
      return res.status(404).json({ message: 'Mock Test not found or not published.' });
    }

    // Attempt stats for this specific user
    const attempts = await MockTestAttempt.find({
      userId: req.user._id,
      mockTestId: mockTest._id
    }).select('status score accuracy startedAt').sort('-createdAt').lean();

    const activeAttempt = attempts.find(a => ['created', 'started'].includes(a.status));
    const completedAttempts = attempts.filter(a => a.status === 'submitted');

    // Strip actual fixedQuestionIds / selectionRules to prevent scraping
    delete mockTest.fixedQuestionIds;
    delete mockTest.selectionRules;

    res.status(200).json({
      success: true,
      mockTest,
      userAttemptsCount: completedAttempts.length,
      activeAttemptId: activeAttempt?._id || null,
      isAttemptLimitReached: completedAttempts.length >= (mockTest.attemptLimit || 1),
      attempts,
    });
  } catch (error) {
    next(error);
  }
};

// 3. POST /api/mock-tests/:id/start (Starts attempt)
export const startMockTestAttempt = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest || mockTest.status !== 'published') {
      return res.status(404).json({ message: 'Mock test is not available or draft.' });
    }

    const { allowShortageMode = false } = req.body;

    // Check availability window
    const now = new Date();
    if (mockTest.availableFrom && now < new Date(mockTest.availableFrom)) {
      return res.status(400).json({ message: 'This mock test is not available yet.' });
    }
    if (mockTest.availableUntil && now > new Date(mockTest.availableUntil)) {
      return res.status(400).json({ message: 'This mock test has expired and is no longer open.' });
    }

    // Check attempt limit
    const completedAttemptsCount = await MockTestAttempt.countDocuments({
      userId: req.user._id,
      mockTestId: mockTest._id,
      status: 'submitted',
    });

    if (completedAttemptsCount >= (mockTest.attemptLimit || 1)) {
      return res.status(400).json({ message: 'You have reached the maximum attempt limit for this test.' });
    }

    // Check if there is already an active (non-submitted) attempt
    let activeAttempt = await MockTestAttempt.findOne({
      userId: req.user._id,
      mockTestId: mockTest._id,
      status: { $in: ['created', 'started'] }
    });

    if (activeAttempt) {
      // Resume it instead of generating new
      return res.status(200).json({
        success: true,
        message: 'Active attempt resumed.',
        attemptId: activeAttempt._id,
      });
    }

    // Generate questions using mock generator service
    const { selectedQuestions, selectionSummary, shortageDetails, canStart } = await generateMockQuestions(mockTest, req.user._id);

    if (selectedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This mock test has no available questions to load.'
      });
    }

    if (!canStart && !allowShortageMode) {
      let totalRequested = 0;
      let totalAvailable = selectedQuestions.length;
      if (mockTest.questionSelectionMode === 'fixed') {
        totalRequested = mockTest.fixedQuestionIds.length;
      } else {
        totalRequested = mockTest.examPattern?.sections?.reduce((sum, s) => sum + (s.questionCount || 0), 0) || 0;
      }
      return res.status(400).json({
        success: false,
        shortage: true,
        shortageDetails,
        message: `This mock test needs ${totalRequested} questions but only ${totalAvailable} approved questions are available.`
      });
    }

    // Create attempt
    const durationMs = mockTest.durationMinutes * 60 * 1000;
    const startedTime = new Date();
    const expiresTime = new Date(startedTime.getTime() + durationMs);

    const questionsFormatted = selectedQuestions.map(q => ({
      questionId: q._id,
      sectionId: q.sectionId,
      selectedAnswer: '',
      isMarkedForReview: false,
      isBookmarked: false,
      visited: false,
      timeSpentSeconds: 0,
      questionOrder: q.questionOrder,
    }));

    const attempt = await MockTestAttempt.create({
      mockTestId: mockTest._id,
      userId: req.user._id,
      examId: mockTest.examId,
      phaseId: mockTest.phaseId,
      status: 'started',
      questions: questionsFormatted,
      currentQuestionIndex: 0,
      currentSectionIndex: 0,
      startedAt: startedTime,
      expiresAt: expiresTime,
      totalQuestions: questionsFormatted.length,
      totalMarks: mockTest.totalMarks,
      selectionSummary,
    });

    // Strip answers and explanations from the questions payload
    const questionsResponse = selectedQuestions.map(q => {
      const qObj = q.toObject ? q.toObject() : { ...q };
      delete qObj.correctAnswer;
      delete qObj.explanation;
      return qObj;
    });

    res.status(201).json({
      success: true,
      message: 'Mock test attempt started.',
      attemptId: attempt._id,
      questions: questionsResponse,
      expiresAt: expiresTime,
      durationMinutes: mockTest.durationMinutes,
    });
  } catch (error) {
    next(error);
  }
};

// 4. GET /api/mock-tests/attempts/:attemptId (Resume attempt)
export const resumeMockTestAttempt = async (req, res, next) => {
  try {
    const attempt = await MockTestAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to access this attempt.' });
    }

    const mockTest = await MockTest.findById(attempt.mockTestId).lean();
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test details missing.' });
    }

    const now = new Date();
    const expiry = new Date(attempt.expiresAt);

    // Auto-submit if expired
    if (attempt.status === 'started' && now > expiry) {
      await calculateMockResult(attempt._id);
      return res.status(200).json({
        success: false,
        expired: true,
        message: 'This mock test attempt has expired and was auto-submitted.',
        redirectTo: `/aspirant/mock-tests/attempt/${attempt._id}/result`
      });
    }

    if (attempt.status !== 'started') {
      return res.status(400).json({
        success: false,
        submitted: true,
        message: 'This attempt is already submitted or closed.',
        redirectTo: `/aspirant/mock-tests/attempt/${attempt._id}/result`
      });
    }

    // Load detailed questions excluding answers
    const questionIds = attempt.questions.map(q => q.questionId);
    const dbQuestions = await Question.find({ _id: { $in: questionIds } })
      .select('-correctAnswer -explanation')
      .lean();

    // Preserve the order of questions as saved in the attempt
    const questionMap = new Map(dbQuestions.map(q => [q._id.toString(), q]));
    const orderedQuestions = attempt.questions.map(q => {
      const dbQ = questionMap.get(q.questionId.toString());
      return {
        ...dbQ,
        sectionId: q.sectionId,
        questionOrder: q.questionOrder,
      };
    }).sort((a, b) => a.questionOrder - b.questionOrder);

    const remainingSeconds = Math.max(0, Math.round((expiry.getTime() - now.getTime()) / 1000));

    res.status(200).json({
      success: true,
      attempt,
      mockTest,
      questions: orderedQuestions,
      remainingSeconds,
    });
  } catch (error) {
    next(error);
  }
};

// 5. POST /api/mock-tests/attempts/:attemptId/save-answer
export const saveMockAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedAnswer, timeSpentSeconds = 0, currentQuestionIndex = 0, currentSectionIndex = 0 } = req.body;
    const attempt = await MockTestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to save answer.' });
    }

    if (attempt.status !== 'started') {
      return res.status(400).json({ message: 'Attempt is not in active state.' });
    }

    const expiry = new Date(attempt.expiresAt);
    if (new Date() > expiry) {
      await calculateMockResult(attempt._id);
      return res.status(400).json({
        success: false,
        expired: true,
        message: 'This session has expired. Redirecting to results.'
      });
    }

    // Locate matching question
    const qAttempt = attempt.questions.find(q => q.questionId.toString() === questionId);
    if (!qAttempt) {
      return res.status(400).json({ message: 'Question does not belong to this mock test attempt.' });
    }

    qAttempt.selectedAnswer = selectedAnswer !== undefined ? selectedAnswer : '';
    qAttempt.visited = true;
    qAttempt.answerSavedAt = new Date();
    qAttempt.timeSpentSeconds = (qAttempt.timeSpentSeconds || 0) + (Number(timeSpentSeconds) || 0);

    attempt.currentQuestionIndex = Number(currentQuestionIndex) || 0;
    attempt.currentSectionIndex = Number(currentSectionIndex) || 0;

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Answer progress saved.',
    });
  } catch (error) {
    next(error);
  }
};

// 6. POST /api/mock-tests/attempts/:attemptId/mark-review
export const markMockReview = async (req, res, next) => {
  try {
    const { questionId, isMarkedForReview } = req.body;
    const attempt = await MockTestAttempt.findById(req.params.attemptId);

    if (!attempt || attempt.status !== 'started') {
      return res.status(400).json({ message: 'Session is inactive or not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const q = attempt.questions.find(item => item.questionId.toString() === questionId);
    if (!q) {
      return res.status(400).json({ message: 'Question not in attempt.' });
    }

    q.isMarkedForReview = !!isMarkedForReview;
    q.visited = true;
    await attempt.save();

    res.status(200).json({
      success: true,
      isMarkedForReview: q.isMarkedForReview,
    });
  } catch (error) {
    next(error);
  }
};

// 7. POST /api/mock-tests/attempts/:attemptId/bookmark
export const toggleMockBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.body;
    const attempt = await MockTestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const q = attempt.questions.find(item => item.questionId.toString() === questionId);
    if (!q) {
      return res.status(400).json({ message: 'Question not in attempt.' });
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

    q.isBookmarked = isBookmarked;
    await attempt.save();

    res.status(200).json({
      success: true,
      isBookmarked,
    });
  } catch (error) {
    next(error);
  }
};

// 8. POST /api/mock-tests/attempts/:attemptId/submit
export const submitMockTestAttempt = async (req, res, next) => {
  try {
    const attempt = await MockTestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Attempt already submitted.' });
    }

    // Process result
    await calculateMockResult(attempt._id);

    res.status(200).json({
      success: true,
      message: 'Mock test submitted successfully.',
      redirectTo: `/aspirant/mock-tests/attempt/${attempt._id}/result`
    });
  } catch (error) {
    next(error);
  }
};

// 9. POST /api/mock-tests/attempts/:attemptId/auto-submit
export const autoSubmitMockTestAttempt = async (req, res, next) => {
  try {
    const attempt = await MockTestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Attempt already submitted.' });
    }

    const now = new Date();
    const expiry = new Date(attempt.expiresAt);
    
    // Allow minor grace period of 15 seconds for network latency
    if (now.getTime() < expiry.getTime() - 15000) {
      return res.status(400).json({ message: 'Mock test is not expired yet. Denying server auto-submit.' });
    }

    attempt.autoSubmitted = true;
    await attempt.save();

    await calculateMockResult(attempt._id);

    res.status(200).json({
      success: true,
      message: 'Expired attempt auto-submitted.',
      redirectTo: `/aspirant/mock-tests/attempt/${attempt._id}/result`
    });
  } catch (error) {
    next(error);
  }
};

// 10. GET /api/mock-tests/attempts/:attemptId/result
export const getMockTestResult = async (req, res, next) => {
  try {
    const attempt = await MockTestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (attempt.status !== 'submitted') {
      return res.status(400).json({ message: 'Results are only visible after submission.' });
    }

    const mockTest = await MockTest.findById(attempt.mockTestId).lean();

    // Load questions with full answers and explanations
    const questionIds = attempt.questions.map(q => q.questionId);
    const dbQuestions = await Question.find({ _id: { $in: questionIds } })
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();

    const dbQuestionMap = new Map(dbQuestions.map(q => [q._id.toString(), q]));

    // Construct full review report
    const reviewedQuestions = attempt.questions.map(aq => {
      const qDetails = dbQuestionMap.get(aq.questionId.toString());
      const selected = aq.selectedAnswer || '';
      const correct = qDetails ? (qDetails.correctAnswer || '') : '';
      
      let status = 'skipped';
      if (selected) {
        status = selected.trim() === correct.trim() ? 'correct' : 'incorrect';
      }

      return {
        questionId: aq.questionId,
        questionText: qDetails ? qDetails.questionText : 'Question deleted',
        options: qDetails ? qDetails.options : [],
        selectedAnswer: selected,
        correctAnswer: correct,
        explanation: qDetails ? (qDetails.explanation || '') : '',
        status,
        subject: qDetails?.subjectId?.title || 'General Studies',
        topic: qDetails?.topicId?.title || 'General Concept',
        isBookmarked: aq.isBookmarked,
        timeSpentSeconds: aq.timeSpentSeconds,
        questionOrder: aq.questionOrder,
      };
    }).sort((a, b) => a.questionOrder - b.questionOrder);

    res.status(200).json({
      success: true,
      attempt,
      mockTest,
      reviewedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// 11. GET /api/mock-tests/my-attempts
export const getMyMockTestAttempts = async (req, res, next) => {
  try {
    const attempts = await MockTestAttempt.find({ userId: req.user._id })
      .populate('mockTestId', 'title category durationMinutes totalQuestions totalMarks')
      .populate('examId', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};
