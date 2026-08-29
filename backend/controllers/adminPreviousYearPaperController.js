import PreviousYearPaper from '../models/PreviousYearPaper.js';
import Question          from '../models/Question.js';
import mongoose          from 'mongoose';

// ── helper: Recalculate counters ─────────────────────────────────────────────
async function recalculatePaperStats(paper) {
  const questions = await Question.find({
    _id: { $in: paper.questionIds },
  }).select('marks');

  paper.totalQuestions = paper.questionIds.length;
  paper.totalMarks     = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  await paper.save();
}

// ─── 1. POST /api/admin/previous-year-papers ──────────────────────────────────
// @desc  Create previous year paper metadata
// @route POST /api/admin/previous-year-papers
// @access Private/Admin
export const createPaper = async (req, res, next) => {
  try {
    const {
      title,
      examId,
      phaseId,
      year,
      paperType,
      paperCode,
      language,
      durationMinutes,
      negativeMarkingEnabled,
      defaultNegativeMarks,
      instructions,
      source,
      paperPdfUrl,
      answerKeyPdfUrl,
      sections,
    } = req.body;

    // Check duplicate
    const existing = await PreviousYearPaper.findOne({
      examId,
      year,
      paperType,
      paperCode,
    });
    if (existing) {
      return res.status(400).json({
        message: `Paper with Code '${paperCode}' already exists for this exam, year, and type.`,
      });
    }

    const paper = await PreviousYearPaper.create({
      title,
      examId,
      phaseId,
      year,
      paperType,
      paperCode,
      language,
      durationMinutes,
      negativeMarkingEnabled,
      defaultNegativeMarks,
      instructions,
      source,
      paperPdfUrl,
      answerKeyPdfUrl,
      sections: sections || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Previous Year Paper created successfully.',
      paper,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. GET /api/admin/previous-year-papers ───────────────────────────────────
// @desc  Get list of previous year papers with filters
// @route GET /api/admin/previous-year-papers
// @access Private/Admin
export const getPapers = async (req, res, next) => {
  try {
    const { examId, year, paperType, language, isPublished } = req.query;
    const filter = {};

    if (examId)      filter.examId = examId;
    if (year)        filter.year = Number(year);
    if (paperType)   filter.paperType = paperType;
    if (language)    filter.language = language;
    if (isPublished) filter.isPublished = isPublished === 'true';

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

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

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      papers,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. GET /api/admin/previous-year-papers/:id ───────────────────────────────
// @desc  Get detailed previous year paper with populated questions
// @route GET /api/admin/previous-year-papers/:id
// @access Private/Admin
export const getPaperById = async (req, res, next) => {
  try {
    const paper = await PreviousYearPaper.findById(req.params.id)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .populate('questionIds');

    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found.' });
    }

    res.status(200).json({
      success: true,
      paper,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. PUT /api/admin/previous-year-papers/:id ───────────────────────────────
// @desc  Update paper metadata info (does not modify question list directly)
// @route PUT /api/admin/previous-year-papers/:id
// @access Private/Admin
export const updatePaper = async (req, res, next) => {
  try {
    const {
      title,
      examId,
      phaseId,
      year,
      paperType,
      paperCode,
      language,
      durationMinutes,
      negativeMarkingEnabled,
      defaultNegativeMarks,
      instructions,
      source,
      paperPdfUrl,
      answerKeyPdfUrl,
      sections,
    } = req.body;

    const paper = await PreviousYearPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found.' });
    }

    // Check duplicate if values are changing
    if (
      examId !== undefined ||
      year !== undefined ||
      paperType !== undefined ||
      paperCode !== undefined
    ) {
      const checkExam = examId !== undefined ? examId : paper.examId;
      const checkYear = year !== undefined ? Number(year) : paper.year;
      const checkType = paperType !== undefined ? paperType : paper.paperType;
      const checkCode = paperCode !== undefined ? paperCode : paper.paperCode;

      const duplicate = await PreviousYearPaper.findOne({
        _id: { $ne: paper._id },
        examId: checkExam,
        year: checkYear,
        paperType: checkType,
        paperCode: checkCode,
      });

      if (duplicate) {
        return res.status(400).json({
          message: 'Update failed. A duplicate paper already exists matching Exam, Year, Type, and Code.',
        });
      }
    }

    if (title !== undefined)                  paper.title = title;
    if (examId !== undefined)                 paper.examId = examId;
    if (phaseId !== undefined)                paper.phaseId = phaseId;
    if (year !== undefined)                   paper.year = Number(year);
    if (paperType !== undefined)              paper.paperType = paperType;
    if (paperCode !== undefined)              paper.paperCode = paperCode;
    if (language !== undefined)               paper.language = language;
    if (durationMinutes !== undefined)        paper.durationMinutes = durationMinutes;
    if (negativeMarkingEnabled !== undefined) paper.negativeMarkingEnabled = negativeMarkingEnabled;
    if (defaultNegativeMarks !== undefined)   paper.defaultNegativeMarks = defaultNegativeMarks;
    if (instructions !== undefined)           paper.instructions = instructions;
    if (source !== undefined)                 paper.source = source;
    if (paperPdfUrl !== undefined)            paper.paperPdfUrl = paperPdfUrl;
    if (answerKeyPdfUrl !== undefined)        paper.answerKeyPdfUrl = answerKeyPdfUrl;
    if (sections !== undefined)               paper.sections = sections;

    await paper.save();
    // Re-stat just in case
    await recalculatePaperStats(paper);

    res.status(200).json({
      success: true,
      message: 'Paper details updated successfully.',
      paper,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 5. DELETE /api/admin/previous-year-papers/:id ────────────────────────────
// @desc  Delete a paper metadata record
// @route DELETE /api/admin/previous-year-papers/:id
// @access Private/Admin
export const deletePaper = async (req, res, next) => {
  try {
    const paper = await PreviousYearPaper.findByIdAndDelete(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Previous Year Paper deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6. POST /api/admin/previous-year-papers/:id/questions ────────────────────
// @desc  Assign a question from question bank to a paper
// @route POST /api/admin/previous-year-papers/:id/questions
// @access Private/Admin
export const addQuestionToPaper = async (req, res, next) => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ message: 'questionId is required.' });
    }

    const paper = await PreviousYearPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found.' });
    }

    // Validate question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question does not exist in Question bank.' });
    }

    // Validate exam & phase matching to prevent wrong exam questions inside a paper
    if (
      question.examId.toString() !== paper.examId.toString() ||
      question.phaseId.toString() !== paper.phaseId.toString()
    ) {
      return res.status(400).json({
        message: 'Validation failed. Question target exam/phase does not match paper target.',
      });
    }

    // Prevent duplicate questions inside a paper
    if (paper.questionIds.includes(questionId)) {
      return res.status(400).json({ message: 'Question is already added to this paper.' });
    }

    paper.questionIds.push(questionId);
    await recalculatePaperStats(paper);

    res.status(200).json({
      success: true,
      message: 'Question added to paper successfully.',
      paper,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 7. DELETE /api/admin/previous-year-papers/:id/questions/:questionId ──────
// @desc  Deassign a question from paper
// @route DELETE /api/admin/previous-year-papers/:id/questions/:questionId
// @access Private/Admin
export const removeQuestionFromPaper = async (req, res, next) => {
  try {
    const { id, questionId } = req.params;

    const paper = await PreviousYearPaper.findById(id);
    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found.' });
    }

    const idx = paper.questionIds.indexOf(questionId);
    if (idx === -1) {
      return res.status(404).json({ message: 'Question is not assigned to this paper.' });
    }

    paper.questionIds.splice(idx, 1);
    await recalculatePaperStats(paper);

    res.status(200).json({
      success: true,
      message: 'Question removed from paper successfully.',
      paper,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 8. PATCH /api/admin/previous-year-papers/:id/publish ──────────────────────
// @desc  Publish / unpublish a paper draft
// @route PATCH /api/admin/previous-year-papers/:id/publish
// @access Private/Admin
export const publishPaper = async (req, res, next) => {
  try {
    const { isPublished } = req.body;
    if (isPublished === undefined) {
      return res.status(400).json({ message: 'isPublished boolean is required.' });
    }

    const paper = await PreviousYearPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'Previous year paper not found.' });
    }

    paper.isPublished = !!isPublished;
    await paper.save();

    res.status(200).json({
      success: true,
      message: `Paper status set to ${paper.isPublished ? 'published' : 'draft'} successfully.`,
      paper,
    });
  } catch (err) {
    next(err);
  }
};
