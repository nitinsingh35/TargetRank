import ContentImportBatch from '../models/ContentImportBatch.js';
import Question from '../models/Question.js';
import ContentCoverageTarget from '../models/ContentCoverageTarget.js';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import QuestionReport from '../models/QuestionReport.js';

import { validateMCQ } from '../services/generators/validators.js';
import { normalizeText, generateHash, getSimilarityScore } from '../services/generators/duplicateChecker.js';

// Quote-Safe CSV Parser
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse comma-separated cells ignoring commas within quotes
    const cells = [];
    let insideQuote = false;
    let currentCell = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    if (cells.length > 0) {
      result.push({ rowIndex: i, cells });
    }
  }

  return result;
};

// ─── BULK IMPORT ENDPOINTS ───

// @desc    Import questions via CSV
// @route   POST /api/content/import/csv
// @access  Private/Admin or Mentor
export const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required.' });
    }

    const { examId, sourceType = 'practice_generated', language = 'english' } = req.body;
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID mapping is required.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const parsedRows = parseCSV(fileContent);

    // Create a new batch document
    const batch = await ContentImportBatch.create({
      batchName: `CSV Import (${new Date().toLocaleDateString('en-IN')})`,
      contentType: 'csv',
      uploadedBy: req.user._id,
      status: 'validating',
      totalRows: parsedRows.length,
    });

    const phase = await ExamPhase.findOne({ examId });
    const phaseId = phase ? phase._id : null;
    const subject = await Subject.findOne({ examId });
    const subjectId = subject ? subject._id : null;
    const topic = await Topic.findOne({ examId });
    const topicId = topic ? topic._id : null;

    if (!phaseId || !subjectId || !topicId) {
      return res.status(400).json({ message: 'Exam must have syllabus mappings first.' });
    }

    const validQuestions = [];
    const errorsList = [];
    let duplicateRows = 0;

    for (const row of parsedRows) {
      const { cells, rowIndex } = row;
      // Expected cells mapping:
      // 0: category, 1: questionText, 2: options (pipe separated), 3: correctAnswer, 4: explanation, 5: difficulty, 6: marks, 7: negativeMarks, 8: year, 9: source, 10: tags (comma separated)
      if (cells.length < 5) {
        errorsList.push({
          rowNumber: rowIndex,
          message: 'Insufficient columns. Expected at least category, questionText, options, correctAnswer, and explanation.',
        });
        continue;
      }

      const category = cells[0];
      const questionText = cells[1];
      const options = cells[2] ? cells[2].split('|').map(o => o.trim()) : [];
      const correctAnswer = cells[3];
      const explanation = cells[4];
      const difficulty = cells[5] || 'medium';
      const marks = Number(cells[6]) || 2;
      const negativeMarks = Number(cells[7]) || 0.66;
      const year = cells[8] ? Number(cells[8]) : undefined;
      const sourceName = cells[9] || '';
      const tags = cells[10] ? cells[10].split(',').map(t => t.trim()) : [];

      const qItem = {
        questionText,
        options,
        correctAnswer,
        explanation,
      };

      // Validate MCQ options count and correct key matches
      const validationError = validateMCQ(qItem);
      if (validationError) {
        errorsList.push({
          rowNumber: rowIndex,
          message: validationError,
        });
        continue;
      }

      // Check duplicates
      const hash = generateHash(questionText);
      const duplicateExists = await Question.findOne({ contentHash: hash });
      if (duplicateExists) {
        duplicateRows++;
        continue;
      }

      // Valid question
      validQuestions.push({
        examId,
        phaseId,
        subjectId,
        topicId,
        category: category || 'General Studies',
        questionText,
        options,
        correctAnswer,
        explanation,
        difficulty,
        marks,
        negativeMarks,
        language,
        tags,
        sourceType,
        sourceName,
        verifiedPYQ: sourceType === 'verified_previous_year',
        verificationStatus: req.user.role === 'admin' ? 'verified' : 'pending_review',
        status: req.user.role === 'admin' ? 'published' : 'pending_review',
        createdBy: req.user._id,
        contentHash: hash,
        normalizedQuestionText: normalizeText(questionText),
      });
    }

    // Insert in chunks of 500
    const CHUNK_SIZE = 500;
    if (validQuestions.length > 0) {
      for (let i = 0; i < validQuestions.length; i += CHUNK_SIZE) {
        const chunk = validQuestions.slice(i, i + CHUNK_SIZE);
        await Question.insertMany(chunk);
      }
    }

    // Complete batch details
    batch.validRows = validQuestions.length;
    batch.invalidRows = errorsList.length;
    batch.duplicateRows = duplicateRows;
    batch.importedRows = validQuestions.length;
    batch.pendingReviewRows = req.user.role === 'admin' ? 0 : validQuestions.length;
    batch.errors = errorsList;
    batch.status = 'completed';
    batch.completedAt = new Date();
    await batch.save();

    res.status(200).json({
      message: `Batch validation completed. Validated ${validQuestions.length} records.`,
      batchId: batch._id,
      imported: validQuestions.length,
      invalid: errorsList.length,
      duplicates: duplicateRows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import questions via JSON
// @route   POST /api/content/import/json
// @access  Private/Admin or Mentor
export const importJSON = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'JSON file is required.' });
    }

    const { examId, sourceType = 'practice_generated', language = 'english' } = req.body;
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID mapping is required.' });
    }

    const rawJSON = req.file.buffer.toString('utf-8');
    const questionsArray = JSON.parse(rawJSON);

    if (!Array.isArray(questionsArray)) {
      return res.status(400).json({ message: 'JSON file content must be a valid array of questions.' });
    }

    // Create a new batch document
    const batch = await ContentImportBatch.create({
      batchName: `JSON Import (${new Date().toLocaleDateString('en-IN')})`,
      contentType: 'json',
      uploadedBy: req.user._id,
      status: 'validating',
      totalRows: questionsArray.length,
    });

    const phase = await ExamPhase.findOne({ examId });
    const phaseId = phase ? phase._id : null;
    const subject = await Subject.findOne({ examId });
    const subjectId = subject ? subject._id : null;
    const topic = await Topic.findOne({ examId });
    const topicId = topic ? topic._id : null;

    if (!phaseId || !subjectId || !topicId) {
      return res.status(400).json({ message: 'Exam must have syllabus mappings first.' });
    }

    const validQuestions = [];
    const errorsList = [];
    let duplicateRows = 0;

    questionsArray.forEach((q, idx) => {
      const validationError = validateMCQ(q);
      if (validationError) {
        errorsList.push({
          rowNumber: idx + 1,
          message: validationError,
        });
        return;
      }

      validQuestions.push({
        examId,
        phaseId,
        subjectId,
        topicId,
        category: q.category || 'General Studies',
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        marks: q.marks || 2,
        negativeMarks: q.negativeMarks || 0.66,
        language: q.language || language,
        tags: q.tags || [],
        sourceType: q.sourceType || sourceType,
        sourceName: q.sourceName || '',
        verifiedPYQ: q.sourceType === 'verified_previous_year',
        verificationStatus: req.user.role === 'admin' ? 'verified' : 'pending_review',
        status: req.user.role === 'admin' ? 'published' : 'pending_review',
        createdBy: req.user._id,
        contentHash: generateHash(q.questionText),
        normalizedQuestionText: normalizeText(q.questionText),
      });
    });

    // Deduplicate validQuestions in-memory & check db
    const finalQuestions = [];
    for (const q of validQuestions) {
      const duplicateExists = await Question.findOne({ contentHash: q.contentHash });
      if (duplicateExists) {
        duplicateRows++;
      } else {
        finalQuestions.push(q);
      }
    }

    // Insert in chunks of 500
    const CHUNK_SIZE = 500;
    if (finalQuestions.length > 0) {
      for (let i = 0; i < finalQuestions.length; i += CHUNK_SIZE) {
        const chunk = finalQuestions.slice(i, i + CHUNK_SIZE);
        await Question.insertMany(chunk);
      }
    }

    // Complete batch
    batch.validRows = finalQuestions.length;
    batch.invalidRows = errorsList.length;
    batch.duplicateRows = duplicateRows;
    batch.importedRows = finalQuestions.length;
    batch.errors = errorsList;
    batch.status = 'completed';
    batch.completedAt = new Date();
    await batch.save();

    res.status(200).json({
      message: `Batch validation completed. Validated ${finalQuestions.length} records.`,
      batchId: batch._id,
      imported: finalQuestions.length,
      invalid: errorsList.length,
      duplicates: duplicateRows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get import batches history
// @route   GET /api/content/import/batches
// @access  Private/Admin or Mentor
export const getImportBatches = async (req, res, next) => {
  try {
    const batches = await ContentImportBatch.find()
      .populate('uploadedBy', 'name email')
      .sort('-createdAt');
    res.status(200).json(batches);
  } catch (error) {
    next(error);
  }
};

// @desc    Get import batch details by ID
// @route   GET /api/content/import/batches/:id
// @access  Private/Admin or Mentor
export const getImportBatchById = async (req, res, next) => {
  try {
    const batch = await ContentImportBatch.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    res.status(200).json(batch);
  } catch (error) {
    next(error);
  }
};

// @desc    Download CSV import template
// @route   GET /api/content/import/template/csv
// @access  Private
export const getCSVTemplate = (req, res) => {
  const headers = 'category,questionText,options (pipe separated A|B|C|D),correctAnswer,explanation,difficulty (easy/medium/hard),marks,negativeMarks,year (optional),source (optional),tags (comma separated)\n';
  const row = 'General Studies,"Under the Indian Constitution, DPSP are borrowed from which country?",Ireland|USA|Australia|Canada,Ireland,"Borrowed from Ireland.",easy,2,0.66,2021,UPSC CSE,DPSP,Polity\n';
  
  res.header('Content-Type', 'text/csv');
  res.attachment('question-import-template.csv');
  res.send(headers + row);
};

// @desc    Download JSON import template
// @route   GET /api/content/import/template/json
// @access  Private
export const getJSONTemplate = (req, res) => {
  const template = [
    {
      category: 'General Studies',
      questionText: 'Under the Indian Constitution, DPSP are borrowed from which country?',
      options: ['Ireland', 'United States', 'Australia', 'Canada'],
      correctAnswer: 'Ireland',
      explanation: 'Borrowed from Ireland.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['DPSP', 'Polity'],
      language: 'english',
      sourceType: 'verified_previous_year',
      sourceName: 'UPSC CSE',
      year: 2021
    }
  ];

  res.header('Content-Type', 'application/json');
  res.attachment('question-import-template.json');
  res.send(JSON.stringify(template, null, 2));
};

// ─── QUESTIONS REVIEW QUEUE ───

// @desc    Get review queue lists (unapproved questions)
// @route   GET /api/questions/review-queue
// @access  Private/Admin or Mentor
export const getReviewQueue = async (req, res, next) => {
  try {
    const queue = await Question.find({ status: 'pending_review' })
      .populate('examId', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .populate('createdBy', 'name email');

    res.status(200).json(queue);
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate single question status
// @route   PUT /api/questions/:id/review
// @access  Private/Admin
export const reviewQuestion = async (req, res, next) => {
  try {
    const { status, reviewComment } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    question.status = status; // published, rejected, archived
    question.reviewComment = reviewComment;
    question.reviewedBy = req.user._id;
    question.reviewedAt = new Date();

    if (status === 'published') {
      question.verificationStatus = 'verified';
    }

    await question.save();
    res.status(200).json({ message: `Question status updated to ${status}.` });
  } catch (error) {
    next(error);
  }
};

// ─── CONTENT COVERAGE & GAPS ANALYTICS ───

// @desc    Get content coverage summaries
// @route   GET /api/content/coverage
// @access  Private/Admin or Mentor
export const getContentCoverage = async (req, res, next) => {
  try {
    const targets = await ContentCoverageTarget.find()
      .populate('examId', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title');

    // Dynamically calculate current published totals for accuracy
    const coverageReport = [];
    for (const target of targets) {
      const publishedCount = await Question.countDocuments({
        topicId: target.topicId,
        status: 'published',
      });
      const pyqCount = await Question.countDocuments({
        topicId: target.topicId,
        status: 'published',
        sourceType: 'verified_previous_year',
      });

      // Update status dynamically
      let coverageStatus = 'critical_gap';
      if (publishedCount >= target.targetQuestionCount) {
        coverageStatus = 'target_achieved';
      } else if (publishedCount >= target.targetQuestionCount * 0.7) {
        coverageStatus = 'sufficient';
      } else if (publishedCount >= target.targetQuestionCount * 0.4) {
        coverageStatus = 'moderate_gap';
      }

      target.currentPublishedCount = publishedCount;
      target.currentPYQCount = pyqCount;
      target.coverageStatus = coverageStatus;
      await target.save();

      coverageReport.push({
        _id: target._id,
        examName: target.examId?.title || 'Unknown Exam',
        subjectName: target.subjectId?.title || 'Unknown Subject',
        topicName: target.topicId?.title || 'Unknown Topic',
        targetCount: target.targetQuestionCount,
        publishedCount,
        pyqCount,
        coverageStatus,
      });
    }

    res.status(200).json(coverageReport);
  } catch (error) {
    next(error);
  }
};

// @desc    Identify content gaps
// @route   GET /api/content/gaps
// @access  Private/Admin or Mentor
export const getCoverageGaps = async (req, res, next) => {
  try {
    const targets = await ContentCoverageTarget.find()
      .populate('examId', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title');

    const gapsList = [];

    for (const t of targets) {
      const publishedCount = await Question.countDocuments({ topicId: t.topicId, status: 'published' });
      const pyqCount = await Question.countDocuments({ topicId: t.topicId, status: 'published', sourceType: 'verified_previous_year' });
      const hindiCount = await Question.countDocuments({ topicId: t.topicId, status: 'published', language: 'hindi' });
      const missingExplCount = await Question.countDocuments({ topicId: t.topicId, status: 'published', explanation: { $in: [null, ''] } });

      const warnings = [];
      if (publishedCount < 500) warnings.push('Critical Question Count (fewer than 500)');
      if (pyqCount === 0) warnings.push('Zero Verified PYQs found');
      if (hindiCount === 0) warnings.push('Missing Hindi translation content');
      if (missingExplCount > 0) warnings.push(`Explanation missing on ${missingExplCount} questions`);

      if (warnings.length > 0) {
        gapsList.push({
          exam: t.examId?.title || 'Exam',
          subject: t.subjectId?.title || 'Subject',
          topic: t.topicId?.title || 'Topic',
          publishedCount,
          warnings,
        });
      }
    }

    res.status(200).json(gapsList);
  } catch (error) {
    next(error);
  }
};
