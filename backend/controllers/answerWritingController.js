import DescriptiveQuestion from '../models/DescriptiveQuestion.js';
import AnswerSubmission    from '../models/AnswerSubmission.js';
import MentorFeedback     from '../models/MentorFeedback.js';

// Helper: Calculate word count
const calculateWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// ─── 1. GET /api/answer-writing/questions ─────────────────────────────────────
// @desc  Browse published descriptive questions with hasSubmissions flag
// @route GET /api/answer-writing/questions
// @access Private
export const getQuestions = async (req, res, next) => {
  try {
    const { examId, phaseId, subjectId, topicId, year, sourceType, difficulty, marks } = req.query;
    const filter = { isPublished: true };

    if (examId)     filter.examId = examId;
    if (phaseId)    filter.phaseId = phaseId;
    if (subjectId)  filter.subjectId = subjectId;
    if (topicId)    filter.topicId = topicId;
    if (year)       filter.year = Number(year);
    if (sourceType) filter.sourceType = sourceType;
    if (difficulty) filter.difficulty = difficulty;
    if (marks)      filter.marks = Number(marks);

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      DescriptiveQuestion.find(filter)
        .select('-modelAnswer -answerFramework') // Exclude keys from list
        .populate('examId', 'title')
        .populate('subjectId', 'title')
        .populate('topicId', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      DescriptiveQuestion.countDocuments(filter),
    ]);

    // Check user submissions to mark hasSubmissions flag
    const questionIds = questions.map(q => q._id);
    const userSubmissions = await AnswerSubmission.find({
      userId: req.user._id,
      descriptiveQuestionId: { $in: questionIds },
    }).select('descriptiveQuestionId').lean();

    const submittedQSet = new Set(
      userSubmissions.map(s => s.descriptiveQuestionId.toString())
    );

    const enriched = questions.map(q => ({
      ...q,
      hasSubmissions: submittedQSet.has(q._id.toString()),
    }));

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      questions: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. GET /api/answer-writing/questions/:id ─────────────────────────────────
// @desc  Get descriptive question detail with basic hints (hides model answer before review)
// @route GET /api/answer-writing/questions/:id
// @access Private
export const getQuestionById = async (req, res, next) => {
  try {
    const question = await DescriptiveQuestion.findOne({
      _id: req.params.id,
      isPublished: true,
    })
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();

    if (!question) {
      return res.status(404).json({ message: 'Descriptive question not found or unpublished.' });
    }

    // Check if the user has a reviewed submission for this question to safely expose modelAnswer
    const reviewedSubmission = await AnswerSubmission.findOne({
      userId: req.user._id,
      descriptiveQuestionId: question._id,
      status: 'reviewed',
    }).lean();

    // Hide model answers by default unless reviewed
    if (!reviewedSubmission) {
      delete question.modelAnswer;
      delete question.modelAnswerHindi;
    }

    res.status(200).json({
      success: true,
      question,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. POST /api/answer-writing/submissions ──────────────────────────────────
// @desc  Create a new submission or draft for a descriptive question
// @route POST /api/answer-writing/submissions
// @access Private
export const createSubmission = async (req, res, next) => {
  try {
    const { descriptiveQuestionId, answerText, timeTakenSeconds, aspirantSelfRating, status = 'draft' } = req.body;

    const question = await DescriptiveQuestion.findById(descriptiveQuestionId);
    if (!question) {
      return res.status(404).json({ message: 'Descriptive question not found.' });
    }

    const wordCount = calculateWordCount(answerText);

    const now = new Date();
    const submission = await AnswerSubmission.create({
      userId: req.user._id,
      descriptiveQuestionId,
      examId:    question.examId,
      phaseId:   question.phaseId,
      subjectId: question.subjectId,
      topicId:   question.topicId,
      answerText: answerText || '',
      wordCount,
      timeTakenSeconds: timeTakenSeconds || 0,
      status:           status === 'submitted' ? 'submitted' : 'draft',
      aspirantSelfRating,
      submittedAt:      status === 'submitted' ? now : null,
      lastSavedAt:      now,
    });

    res.status(201).json({
      success: true,
      message: status === 'submitted' ? 'Answer submitted successfully.' : 'Draft saved successfully.',
      submissionId: submission._id,
      submission,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. PUT /api/answer-writing/submissions/:id/draft ──────────────────────────
// @desc  Auto-save draft content updates
// @route PUT /api/answer-writing/submissions/:id/draft
// @access Private
export const saveDraft = async (req, res, next) => {
  try {
    const { answerText, timeTakenSeconds } = req.body;

    const submission = await AnswerSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission session not found.' });
    }

    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to submission.' });
    }

    if (submission.status !== 'draft') {
      return res.status(400).json({
        message: 'Cannot save changes. The answer has already been submitted or completed.',
        status: submission.status,
      });
    }

    const wordCount = calculateWordCount(answerText);
    const now = new Date();

    submission.answerText = answerText || '';
    submission.wordCount = wordCount;
    if (timeTakenSeconds !== undefined) {
      submission.timeTakenSeconds = Number(timeTakenSeconds);
    }
    submission.lastSavedAt = now;

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Draft auto-saved.',
      lastSavedAt: now,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 5. POST /api/answer-writing/submissions/:id/submit ────────────────────────
// @desc  Submit descriptive answer submission (blocks future edits)
// @route POST /api/answer-writing/submissions/:id/submit
// @access Private
export const submitAnswer = async (req, res, next) => {
  try {
    const submission = await AnswerSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission session not found.' });
    }

    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (submission.status !== 'draft') {
      return res.status(400).json({
        message: 'Submission status is not draft.',
        status: submission.status,
      });
    }

    if (!submission.answerText || submission.answerText.trim() === '') {
      return res.status(400).json({ message: 'Cannot submit an empty answer.' });
    }

    submission.status = 'submitted';
    submission.submittedAt = new Date();
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Mains answer submission completed.',
      submission,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6. GET /api/answer-writing/submissions ────────────────────────────────────
// @desc  Browse logged-in aspirant's submission logs
// @route GET /api/answer-writing/submissions
// @access Private
export const getSubmissionHistory = async (req, res, next) => {
  try {
    const { examId, subjectId, topicId, status } = req.query;
    const filter = { userId: req.user._id };

    if (examId)    filter.examId = examId;
    if (subjectId) filter.subjectId = subjectId;
    if (topicId)   filter.topicId = topicId;
    if (status)    filter.status = status;

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      AnswerSubmission.find(filter)
        .populate('descriptiveQuestionId', 'questionText marks suggestedWordLimit')
        .populate('mentorFeedbackId', 'marksAwarded overallFeedback mentorId')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      AnswerSubmission.countDocuments(filter),
    ]);

    const enriched = submissions.map(sub => {
      const q = sub.descriptiveQuestionId || {};
      const f = sub.mentorFeedbackId || null;

      return {
        _id:            sub._id,
        status:         sub.status,
        submittedAt:    sub.submittedAt || sub.createdAt,
        questionText:   q.questionText || '',
        maxMarks:       q.marks || 0,
        wordLimit:      q.suggestedWordLimit || 0,
        marksAwarded:   f ? f.marksAwarded : null,
        feedbackSummary: f ? f.overallFeedback : null,
      };
    });

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      submissions: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 7. GET /api/answer-writing/submissions/:id ────────────────────────────────
// @desc  Get submission details, descriptiveQuestion, and mentor feedback
// @route GET /api/answer-writing/submissions/:id
// @access Private
export const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await AnswerSubmission.findById(req.params.id)
      .populate({
        path: 'descriptiveQuestionId',
        populate: [
          { path: 'examId', select: 'title' },
          { path: 'phaseId', select: 'title' },
          { path: 'subjectId', select: 'title' },
          { path: 'topicId', select: 'title' }
        ]
      })
      .populate('mentorFeedbackId')
      .lean();

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to submission.' });
    }

    // Hide model answer from populated question details unless status is reviewed
    const question = submission.descriptiveQuestionId;
    if (question && submission.status !== 'reviewed') {
      delete question.modelAnswer;
      delete question.modelAnswerHindi;
    }

    res.status(200).json({
      success: true,
      submission,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 8. POST /api/answer-writing/submissions/:id/bookmark ──────────────────────
// @desc  Toggle bookmark status on a submission
// @route POST /api/answer-writing/submissions/:id/bookmark
// @access Private
export const toggleSubmissionBookmark = async (req, res, next) => {
  try {
    const submission = await AnswerSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });

    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    submission.isBookmarked = !submission.isBookmarked;
    await submission.save();

    res.status(200).json({
      success: true,
      message: submission.isBookmarked ? 'Bookmarked successfully.' : 'Bookmark removed.',
      isBookmarked: submission.isBookmarked,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 9. GET /api/answer-writing/analytics ──────────────────────────────────────
// @desc  Get answer writing practice performance analytics
// @route GET /api/answer-writing/analytics
// @access Private
export const getAnswerWritingAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all submissions of the user
    const submissions = await AnswerSubmission.find({ userId })
      .populate('descriptiveQuestionId', 'marks questionText')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .populate('mentorFeedbackId')
      .lean();

    const totalSubmissions = submissions.length;

    // Filter statuses
    const statusCounts = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      reviewed: 0,
      returned: 0,
    };

    let totalScore = 0;
    let totalMax = 0;
    let reviewedCount = 0;

    // Subject/Topic maps
    const subjectMap = new Map();
    const topicMap = new Map();

    const recentFeedback = [];

    for (const sub of submissions) {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;

      const feedback = sub.mentorFeedbackId;
      const isReviewed = sub.status === 'reviewed' && feedback;

      // Group subject performance
      const subId = sub.subjectId?._id?.toString() || 'unknown';
      const subName = sub.subjectId?.title || 'General Studies';
      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subjectId: subId,
          subjectName: subName,
          total: 0,
          reviewed: 0,
          earnedSum: 0,
          maxSum: 0,
        });
      }
      const subStat = subjectMap.get(subId);
      subStat.total += 1;

      // Group topic performance
      const topId = sub.topicId?._id?.toString() || 'unknown';
      const topName = sub.topicId?.title || 'General Concept';
      if (!topicMap.has(topId)) {
        topicMap.set(topId, {
          topicId: topId,
          topicName: topName,
          total: 0,
          reviewed: 0,
          earnedSum: 0,
          maxSum: 0,
        });
      }
      const topStat = topicMap.get(topId);
      topStat.total += 1;

      if (isReviewed) {
        reviewedCount += 1;
        totalScore += feedback.marksAwarded;
        totalMax += feedback.maxMarks;

        subStat.reviewed += 1;
        subStat.earnedSum += feedback.marksAwarded;
        subStat.maxSum += feedback.maxMarks;

        topStat.reviewed += 1;
        topStat.earnedSum += feedback.marksAwarded;
        topStat.maxSum += feedback.maxMarks;

        // Save for recent feedback trend
        recentFeedback.push({
          submissionId: sub._id,
          questionText: sub.descriptiveQuestionId?.questionText || '',
          marksAwarded: feedback.marksAwarded,
          maxMarks: feedback.maxMarks,
          overallFeedback: feedback.overallFeedback,
          reviewedAt: feedback.reviewedAt || feedback.updatedAt || sub.updatedAt,
        });
      }
    }

    const avgMarksPercentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

    // Convert performance maps to lists with percentages
    const subjectPerformance = Array.from(subjectMap.values()).map(sub => {
      const avgPercentage = sub.maxSum > 0 ? (sub.earnedSum / sub.maxSum) * 100 : 0;
      return {
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        total: sub.total,
        reviewed: sub.reviewed,
        avgScore: Number((sub.reviewed > 0 ? sub.earnedSum / sub.reviewed : 0).toFixed(2)),
        avgMax: Number((sub.reviewed > 0 ? sub.maxSum / sub.reviewed : 0).toFixed(2)),
        avgPercentage: Number(avgPercentage.toFixed(1)),
      };
    });

    const topicPerformance = Array.from(topicMap.values()).map(top => {
      const avgPercentage = top.maxSum > 0 ? (top.earnedSum / top.maxSum) * 100 : 0;
      return {
        topicId: top.topicId,
        topicName: top.topicName,
        total: top.total,
        reviewed: top.reviewed,
        avgScore: Number((top.reviewed > 0 ? top.earnedSum / top.reviewed : 0).toFixed(2)),
        avgMax: Number((top.reviewed > 0 ? top.maxSum / top.reviewed : 0).toFixed(2)),
        avgPercentage: Number(avgPercentage.toFixed(1)),
      };
    });

    // Detect weak areas (accuracy/percentage < 50%)
    const weakSubjects = subjectPerformance.filter(s => s.reviewed > 0 && s.avgPercentage < 50);
    const weakTopics = topicPerformance.filter(t => t.reviewed > 0 && t.avgPercentage < 50);

    // Limit recent feedbacks to latest 5
    recentFeedback.sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));
    const latestFeedback = recentFeedback.slice(0, 5);

    // Dynamic suggestions next actions
    let actionSuggestion = 'Continue practicing descriptive questions from the writing library to start generating mentor analytics.';
    if (reviewedCount > 0) {
      if (avgMarksPercentage >= 70) {
        actionSuggestion = 'Excellent descriptive answer layout! Keep practicing PYQs to maintain strong analytical structure.';
      } else if (avgMarksPercentage >= 50) {
        actionSuggestion = 'Steady progress. Focus on incorporating recommended keywords and structuring introduction paragraphs to push scores higher.';
      } else {
        actionSuggestion = 'Your descriptive answers are falling below average. Focus on reading framework hints and matching suggested keywords before writing drafts.';
      }
    }

    res.status(200).json({
      success: true,
      totalSubmissions,
      reviewedSubmissions: reviewedCount,
      avgMarksPercentage: Number(avgMarksPercentage.toFixed(1)),
      subjectPerformance,
      topicPerformance,
      statusCounts,
      recentFeedback: latestFeedback,
      weakSubjects,
      weakTopics,
      suggestedNextAction: actionSuggestion,
    });
  } catch (err) {
    next(err);
  }
};
