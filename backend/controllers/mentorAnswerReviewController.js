import AnswerSubmission    from '../models/AnswerSubmission.js';
import MentorFeedback     from '../models/MentorFeedback.js';
import DescriptiveQuestion from '../models/DescriptiveQuestion.js';

// ─── 1. GET /api/mentor/answer-submissions ────────────────────────────────────
// @desc  Browse submitted descriptive answers for review (Mentor/Admin filter rules)
// @route GET /api/mentor/answer-submissions
// @access Private/Mentor/Admin
export const getSubmittedAnswers = async (req, res, next) => {
  try {
    const { status, examId, subjectId, topicId } = req.query;
    const filter = { status: { $ne: 'draft' } }; // Never show raw drafts to reviewers

    // Apply Mentor vs Admin visibility boundaries
    if (req.user.role === 'admin') {
      // Admin sees everything
    } else if (req.user.role === 'mentor') {
      // Mentors see only their assigned items
      filter.assignedMentorId = req.user._id;
    } else {
      return res.status(403).json({ message: 'Access forbidden. Mentors and Admins only.' });
    }

    if (status)    filter.status = status;
    if (examId)    filter.examId = examId;
    if (subjectId) filter.subjectId = subjectId;
    if (topicId)   filter.topicId = topicId;

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      AnswerSubmission.find(filter)
        .populate('userId', 'name email')
        .populate('descriptiveQuestionId', 'questionText marks suggestedWordLimit')
        .populate('assignedMentorId', 'name')
        .populate('mentorFeedbackId')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      AnswerSubmission.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      submissions,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. POST /api/mentor/answer-submissions/:id/assign ────────────────────────
// @desc  Assign a mentor to a submission (Admin only action)
// @route POST /api/mentor/answer-submissions/:id/assign
// @access Private/Admin
export const assignMentor = async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    if (!mentorId) {
      return res.status(400).json({ message: 'mentorId is required.' });
    }

    const submission = await AnswerSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.status === 'draft') {
      return res.status(400).json({ message: 'Cannot assign mentor to draft submissions.' });
    }

    submission.assignedMentorId = mentorId;
    submission.status = 'under_review';
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Mentor assigned and status set to under_review successfully.',
      submission,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. POST /api/mentor/answer-submissions/:id/review ────────────────────────
// @desc  Submit mentor grading, ratings, feedback points
// @route POST /api/mentor/answer-submissions/:id/review
// @access Private/Mentor/Admin
export const reviewAnswer = async (req, res, next) => {
  try {
    const {
      marksAwarded,
      overallFeedback,
      introductionFeedback,
      bodyFeedback,
      conclusionFeedback,
      strengths,
      improvements,
      keywordCoverage,
      structureRating,
      contentRating,
      presentationRating,
      suggestedAnswerApproach,
    } = req.body;

    const submission = await AnswerSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.status === 'draft') {
      return res.status(400).json({ message: 'Cannot review draft answers.' });
    }

    // Role safety guards: Mentor must be assigned, unless Admin does the review
    const isAdmin = req.user.role === 'admin';
    const isAssignedMentor = submission.assignedMentorId && submission.assignedMentorId.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignedMentor) {
      return res.status(403).json({
        message: 'Unauthorized. You must be the assigned mentor or an administrator to submit feedback.',
      });
    }

    // Validate marks limit
    const question = await DescriptiveQuestion.findById(submission.descriptiveQuestionId);
    if (!question) {
      return res.status(404).json({ message: 'Question framework not found.' });
    }

    if (marksAwarded > question.marks) {
      return res.status(400).json({
        message: `Validation failed. Awarded marks (${marksAwarded}) cannot exceed question max marks (${question.marks}).`,
      });
    }

    // Upsert feedback
    const feedback = await MentorFeedback.findOneAndUpdate(
      { answerSubmissionId: submission._id },
      {
        answerSubmissionId:      submission._id,
        mentorId:                req.user._id,
        userId:                  submission.userId,
        marksAwarded:            Number(marksAwarded),
        maxMarks:                question.marks,
        overallFeedback:         overallFeedback || '',
        introductionFeedback:    introductionFeedback || '',
        bodyFeedback:            bodyFeedback || '',
        conclusionFeedback:      conclusionFeedback || '',
        strengths:               strengths || [],
        improvements:            improvements || [],
        keywordCoverage:         Number(keywordCoverage) || 0,
        structureRating:         structureRating || 'average',
        contentRating:           contentRating || 'average',
        presentationRating:      presentationRating || 'average',
        suggestedAnswerApproach: suggestedAnswerApproach || '',
        reviewedAt:              new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Link feedback back to submission
    submission.status = 'reviewed';
    submission.mentorFeedbackId = feedback._id;
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Mains descriptive feedback saved successfully.',
      feedback,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. POST /api/mentor/answer-submissions/:id/return ────────────────────────
// @desc  Return a submission for revision with feedback remarks
// @route POST /api/mentor/answer-submissions/:id/return
// @access Private/Mentor/Admin
export const returnAnswer = async (req, res, next) => {
  try {
    const { returnMessage } = req.body;
    if (!returnMessage) {
      return res.status(400).json({ message: 'returnMessage is required to return a submission.' });
    }

    const submission = await AnswerSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.status === 'draft') {
      return res.status(400).json({ message: 'Cannot return draft answers.' });
    }

    const isAdmin = req.user.role === 'admin';
    const isAssignedMentor = submission.assignedMentorId && submission.assignedMentorId.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignedMentor) {
      return res.status(403).json({
        message: 'Unauthorized. Only assigned mentors or admins can return answers for revision.',
      });
    }

    // Save the return message as a draft overallFeedback record
    const feedback = await MentorFeedback.findOneAndUpdate(
      { answerSubmissionId: submission._id },
      {
        answerSubmissionId:      submission._id,
        mentorId:                req.user._id,
        userId:                  submission.userId,
        marksAwarded:            0,
        maxMarks:                10, // Placeholder, updated on full review
        overallFeedback:         `[SUBMISSION RETURNED FOR REVISION] Reason: ${returnMessage}`,
        reviewedAt:              new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    submission.status = 'returned';
    submission.mentorFeedbackId = feedback._id;
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Mains submission returned for revision successfully.',
      submission,
    });
  } catch (err) {
    next(err);
  }
};
