import DescriptiveQuestion from '../models/DescriptiveQuestion.js';
import Exam                from '../models/Exam.js';
import ExamPhase           from '../models/ExamPhase.js';
import Subject             from '../models/Subject.js';
import Topic               from '../models/Topic.js';

// ── helper: Validate related entities ─────────────────────────────────────────
async function validateRelatedEntities({ examId, phaseId, subjectId, topicId }) {
  if (examId) {
    const examExists = await Exam.exists({ _id: examId });
    if (!examExists) throw new Error('Selected Exam does not exist.');
  }
  if (phaseId) {
    const phaseExists = await ExamPhase.exists({ _id: phaseId });
    if (!phaseExists) throw new Error('Selected Exam Phase/Stage does not exist.');
  }
  if (subjectId) {
    const subjectExists = await Subject.exists({ _id: subjectId });
    if (!subjectExists) throw new Error('Selected Subject does not exist.');
  }
  if (topicId) {
    const topicExists = await Topic.exists({ _id: topicId });
    if (!topicExists) throw new Error('Selected Topic does not exist.');
  }
}

// ── helper: Check duplicate descriptive question ──────────────────────────────
async function checkDuplicateQuestion({ examId, year, paperName, questionNumber }, currentId = null) {
  if (!examId || !year || !paperName || !questionNumber) {
    return; // Compound unique constraints only apply when all fields are present
  }

  const query = {
    examId,
    year: Number(year),
    paperName: paperName.trim(),
    questionNumber: Number(questionNumber),
  };

  if (currentId) {
    query._id = { $ne: currentId };
  }

  const existing = await DescriptiveQuestion.findOne(query).lean();
  if (existing) {
    throw new Error(
      `A descriptive question already exists for Paper '${paperName}' (QNo: ${questionNumber}) in Year ${year} under this exam.`
    );
  }
}

// ─── 1. POST /api/admin/descriptive-questions ─────────────────────────────────
// @desc  Create a new descriptive question (defaults to draft/isPublished: false)
// @route POST /api/admin/descriptive-questions
// @access Private/Admin
export const createDescriptiveQuestion = async (req, res, next) => {
  try {
    const {
      questionText,
      questionHindi,
      examId,
      phaseId,
      subjectId,
      topicId,
      year,
      sourceType,
      paperName,
      questionNumber,
      marks,
      suggestedWordLimit,
      suggestedTimeMinutes,
      difficulty,
      answerFramework,
      modelAnswer,
      modelAnswerHindi,
      referenceLinks,
    } = req.body;

    // Validate relationships
    await validateRelatedEntities({ examId, phaseId, subjectId, topicId });

    // Validate duplicate compound index
    await checkDuplicateQuestion({ examId, year, paperName, questionNumber });

    const question = await DescriptiveQuestion.create({
      questionText,
      questionHindi,
      examId,
      phaseId,
      subjectId,
      topicId,
      year: year ? Number(year) : undefined,
      sourceType,
      paperName,
      questionNumber: questionNumber ? Number(questionNumber) : undefined,
      marks,
      suggestedWordLimit,
      suggestedTimeMinutes,
      difficulty,
      answerFramework: answerFramework || {},
      modelAnswer,
      modelAnswerHindi,
      referenceLinks: referenceLinks || [],
      isPublished: false, // Force draft state on creation
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Descriptive question created in draft mode successfully.',
      question,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. GET /api/admin/descriptive-questions ──────────────────────────────────
// @desc  Get list of descriptive questions with advanced filters
// @route GET /api/admin/descriptive-questions
// @access Private/Admin
export const getDescriptiveQuestions = async (req, res, next) => {
  try {
    const { examId, phaseId, subjectId, topicId, year, sourceType, difficulty, isPublished } = req.query;
    const filter = {};

    if (examId)      filter.examId = examId;
    if (phaseId)     filter.phaseId = phaseId;
    if (subjectId)   filter.subjectId = subjectId;
    if (topicId)     filter.topicId = topicId;
    if (year)        filter.year = Number(year);
    if (sourceType)  filter.sourceType = sourceType;
    if (difficulty)  filter.difficulty = difficulty;
    if (isPublished) filter.isPublished = isPublished === 'true';

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      DescriptiveQuestion.find(filter)
        .populate('examId', 'title')
        .populate('phaseId', 'title')
        .populate('subjectId', 'title')
        .populate('topicId', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      DescriptiveQuestion.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      questions,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. GET /api/admin/descriptive-questions/:id ──────────────────────────────
// @desc  Get descriptive question detail by ID
// @route GET /api/admin/descriptive-questions/:id
// @access Private/Admin
export const getDescriptiveQuestionById = async (req, res, next) => {
  try {
    const question = await DescriptiveQuestion.findById(req.params.id)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title');

    if (!question) {
      return res.status(404).json({ message: 'Descriptive question not found.' });
    }

    res.status(200).json({
      success: true,
      question,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. PUT /api/admin/descriptive-questions/:id ──────────────────────────────
// @desc  Update descriptive question metadata, frameworks, answers
// @route PUT /api/admin/descriptive-questions/:id
// @access Private/Admin
export const updateDescriptiveQuestion = async (req, res, next) => {
  try {
    const {
      questionText,
      questionHindi,
      examId,
      phaseId,
      subjectId,
      topicId,
      year,
      sourceType,
      paperName,
      questionNumber,
      marks,
      suggestedWordLimit,
      suggestedTimeMinutes,
      difficulty,
      answerFramework,
      modelAnswer,
      modelAnswerHindi,
      referenceLinks,
    } = req.body;

    const question = await DescriptiveQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Descriptive question not found.' });
    }

    // Validate relationships if changed
    const checkExamId    = examId !== undefined ? examId : question.examId;
    const checkPhaseId   = phaseId !== undefined ? phaseId : question.phaseId;
    const checkSubjectId = subjectId !== undefined ? subjectId : question.subjectId;
    const checkTopicId   = topicId !== undefined ? topicId : question.topicId;

    if (
      examId !== undefined ||
      phaseId !== undefined ||
      subjectId !== undefined ||
      topicId !== undefined
    ) {
      await validateRelatedEntities({
        examId: examId !== undefined ? examId : null,
        phaseId: phaseId !== undefined ? phaseId : null,
        subjectId: subjectId !== undefined ? subjectId : null,
        topicId: topicId !== undefined ? topicId : null,
      });
    }

    // Validate duplicate compound index if filters are updated
    if (
      examId !== undefined ||
      year !== undefined ||
      paperName !== undefined ||
      questionNumber !== undefined
    ) {
      const checkYear   = year !== undefined ? year : question.year;
      const checkPaper  = paperName !== undefined ? paperName : question.paperName;
      const checkQNo    = questionNumber !== undefined ? questionNumber : question.questionNumber;

      await checkDuplicateQuestion(
        {
          examId: checkExamId,
          year: checkYear,
          paperName: checkPaper,
          questionNumber: checkQNo,
        },
        question._id
      );
    }

    if (questionText !== undefined)         question.questionText = questionText;
    if (questionHindi !== undefined)        question.questionHindi = questionHindi;
    if (examId !== undefined)               question.examId = examId;
    if (phaseId !== undefined)              question.phaseId = phaseId;
    if (subjectId !== undefined)            question.subjectId = subjectId;
    if (topicId !== undefined)              question.topicId = topicId;
    if (year !== undefined)                 question.year = year ? Number(year) : undefined;
    if (sourceType !== undefined)           question.sourceType = sourceType;
    if (paperName !== undefined)            question.paperName = paperName;
    if (questionNumber !== undefined)       question.questionNumber = questionNumber ? Number(questionNumber) : undefined;
    if (marks !== undefined)                question.marks = marks;
    if (suggestedWordLimit !== undefined)   question.suggestedWordLimit = suggestedWordLimit;
    if (suggestedTimeMinutes !== undefined) question.suggestedTimeMinutes = suggestedTimeMinutes;
    if (difficulty !== undefined)           question.difficulty = difficulty;
    if (answerFramework !== undefined)       question.answerFramework = answerFramework;
    if (modelAnswer !== undefined)          question.modelAnswer = modelAnswer;
    if (modelAnswerHindi !== undefined)     question.modelAnswerHindi = modelAnswerHindi;
    if (referenceLinks !== undefined)       question.referenceLinks = referenceLinks;

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Descriptive question updated successfully.',
      question,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 5. DELETE /api/admin/descriptive-questions/:id ───────────────────────────
// @desc  Delete descriptive question
// @route DELETE /api/admin/descriptive-questions/:id
// @access Private/Admin
export const deleteDescriptiveQuestion = async (req, res, next) => {
  try {
    const question = await DescriptiveQuestion.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Descriptive question not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Descriptive question deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6. PATCH /api/admin/descriptive-questions/:id/publish ────────────────────
// @desc  Publish / unpublish a draft question
// @route PATCH /api/admin/descriptive-questions/:id/publish
// @access Private/Admin
export const publishDescriptiveQuestion = async (req, res, next) => {
  try {
    const { isPublished } = req.body;
    if (isPublished === undefined) {
      return res.status(400).json({ message: 'isPublished boolean is required.' });
    }

    const question = await DescriptiveQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Descriptive question not found.' });
    }

    question.isPublished = !!isPublished;
    await question.save();

    res.status(200).json({
      success: true,
      message: `Question status set to ${question.isPublished ? 'published' : 'draft'} successfully.`,
      question,
    });
  } catch (err) {
    next(err);
  }
};
