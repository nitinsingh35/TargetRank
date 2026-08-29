import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import QuestionImportBatch from '../models/QuestionImportBatch.js';
import Question from '../models/Question.js';
import {
  parseImportFile,
  validateQuestions,
  runBackgroundCommit,
  rollbackBatchImports
} from '../services/questionImportService.js';

// ─── 1. POST /api/admin/question-import/upload ────────────────────────────────
// @desc  Upload a CSV, JSON, or Excel file for bulk question import
// @route POST /api/admin/question-import/upload
// @access Private/Admin
export const uploadImportFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    if (ext !== 'csv' && ext !== 'json' && ext !== 'xlsx' && ext !== 'xls') {
      // Remove temp file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Unsupported file format. Please upload CSV, JSON, or Excel.' });
    }

    const rows = await parseImportFile(req.file.path, ext);
    if (rows.length > 100000) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: `File too large. Bulk import is limited to 100,000 rows (current file has ${rows.length} rows).`
      });
    }

    const batch = await QuestionImportBatch.create({
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      fileType: ext,
      filePath: req.file.path,
      totalRows: rows.length,
      status: 'uploaded',
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      batchId: batch._id,
      batch,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. POST /api/admin/question-import/:batchId/preview ──────────────────────
// @desc  Preview first 20 rows of the uploaded file and get headers
// @route POST /api/admin/question-import/:batchId/preview
// @access Private/Admin
export const previewImportFile = async (req, res, next) => {
  try {
    const batch = await QuestionImportBatch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Import batch not found.' });

    const rows = await parseImportFile(batch.filePath, batch.fileType, 20);
    
    // Extract headers
    let headers = [];
    if (rows.length > 0) {
      headers = Object.keys(rows[0]);
    }

    batch.previewRows = rows;
    batch.status = 'previewed';
    await batch.save();

    res.status(200).json({
      success: true,
      previewRows: rows,
      headers,
      totalPreviewed: rows.length,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. POST /api/admin/question-import/:batchId/validate ─────────────────────
// @desc  Run full validation report on the uploaded file with optional mapping
// @route POST /api/admin/question-import/:batchId/validate
// @access Private/Admin
export const validateImportFile = async (req, res, next) => {
  try {
    const { fieldMapping, duplicateStance } = req.body;
    const batch = await QuestionImportBatch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Import batch not found.' });

    batch.status = 'validating';
    if (fieldMapping) batch.fieldMapping = fieldMapping;
    if (duplicateStance) batch.duplicateStance = duplicateStance;
    await batch.save();

    const rows = await parseImportFile(batch.filePath, batch.fileType);
    const report = await validateQuestions(rows, req.user._id, fieldMapping);

    batch.totalRows = report.counts.totalRows;
    batch.validRows = report.counts.validRows;
    batch.invalidRows = report.counts.invalidRows;
    batch.duplicateRows = report.counts.duplicateRows;
    batch.validationSummary = report.counts;
    batch.errorReport = report.errorReport;
    batch.status = 'validated';
    
    await batch.save();

    res.status(200).json({
      success: true,
      summary: report.counts,
      errorCount: report.errorReport.length,
      errorReport: report.errorReport,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. POST /api/admin/question-import/:batchId/commit ───────────────────────
// @desc  Commit valid rows to Question collection in the background
// @route POST /api/admin/question-import/:batchId/commit
// @access Private/Admin
export const commitImportFile = async (req, res, next) => {
  try {
    const { duplicateStance: bodyStance } = req.body;
    const batch = await QuestionImportBatch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Import batch not found.' });

    if (batch.status !== 'validated' && batch.status !== 'previewed') {
      return res.status(400).json({
        message: `Invalid batch status for commit operation. Current status: ${batch.status}. Run validation first.`,
      });
    }

    const publishAfterImport = req.body.publishAfterImport === true || req.body.publishAfterImport === 'true';
    const stance = bodyStance || batch.duplicateStance || 'skip';

    batch.status = 'importing';
    batch.startedAt = new Date();
    if (bodyStance) batch.duplicateStance = bodyStance;
    await batch.save();

    const rows = await parseImportFile(batch.filePath, batch.fileType);
    const report = await validateQuestions(rows, req.user._id, batch.fieldMapping);

    if (report.validRowsList.length === 0) {
      batch.status = 'failed';
      await batch.save();
      return res.status(400).json({ message: 'No valid questions to import in this file.' });
    }

    // Process in background chunk-by-chunk to prevent gateway timeouts
    runBackgroundCommit(batch._id, report.validRowsList, publishAfterImport, stance);

    res.status(200).json({
      success: true,
      message: 'Question import initiated in the background. Check batch progress.',
      batch,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 5. GET /api/admin/question-import/batches ────────────────────────────────
// @desc  List upload/import batches with filters
// @route GET /api/admin/question-import/batches
// @access Private/Admin
export const getImportBatches = async (req, res, next) => {
  try {
    const { status, fileType } = req.query;
    const filter = {};

    if (status)   filter.status = status;
    if (fileType) filter.fileType = fileType;

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      QuestionImportBatch.find(filter)
        .populate('uploadedBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      QuestionImportBatch.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      batches,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6. GET /api/admin/question-import/stats ──────────────────────────────────
// @desc  Retrieve stats counts for Import dashboard cards
// @route GET /api/admin/question-import/stats
// @access Private/Admin
export const getImportStats = async (req, res, next) => {
  try {
    const totalImports = await QuestionImportBatch.countDocuments({});
    
    // Aggregation of total imported questions from all batches
    const sumResult = await QuestionImportBatch.aggregate([
      { $group: { _id: null, total: { $sum: '$importedRows' } } }
    ]);
    const importedCount = sumResult.length > 0 ? sumResult[0].total : 0;

    const publishedCount = await Question.countDocuments({ qualityStatus: 'published' });
    const draftCount = await Question.countDocuments({ qualityStatus: 'draft' });
    const pendingReviewCount = await Question.countDocuments({ qualityStatus: 'pending_review' });
    
    // Duplicate detection count
    const dupGroups = await Question.aggregate([
      { $match: { duplicateHash: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$duplicateHash', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    const duplicateCount = dupGroups.reduce((acc, g) => acc + g.count, 0);

    // Sum of errors in errorReport array from all batches
    const errorSumResult = await QuestionImportBatch.aggregate([
      { $project: { errorCount: { $size: '$errorReport' } } },
      { $group: { _id: null, total: { $sum: '$errorCount' } } }
    ]);
    const failedRowsCount = errorSumResult.length > 0 ? errorSumResult[0].total : 0;

    // Last import date
    const lastBatch = await QuestionImportBatch.findOne({ status: 'completed' })
      .sort('-completedAt')
      .select('completedAt');

    res.status(200).json({
      success: true,
      totalImports,
      importedQuestions: importedCount,
      publishedQuestions: publishedCount,
      draftQuestions: draftCount,
      duplicateQuestions: duplicateCount,
      failedRows: failedRowsCount,
      pendingReview: pendingReviewCount,
      lastImportDate: lastBatch ? lastBatch.completedAt : null
    });
  } catch (error) {
    next(error);
  }
};

// ─── 7. GET /api/admin/question-import/:batchId ───────────────────────────────
// @desc  Get details of a single import batch
// @route GET /api/admin/question-import/:batchId
// @access Private/Admin
export const getImportBatchById = async (req, res, next) => {
  try {
    const batch = await QuestionImportBatch.findById(req.params.batchId)
      .populate('uploadedBy', 'name email');

    if (!batch) return res.status(404).json({ message: 'Import batch not found.' });

    res.status(200).json({
      success: true,
      batch,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 8. GET /api/admin/question-import/:batchId/errors ────────────────────────
// @desc  Get batch errors report (CSV or JSON output)
// @route GET /api/admin/question-import/:batchId/errors
// @access Private/Admin
export const getImportBatchErrors = async (req, res, next) => {
  try {
    const batch = await QuestionImportBatch.findById(req.params.batchId).lean();
    if (!batch) return res.status(404).json({ message: 'Import batch not found.' });

    const format = req.query.format || 'json';

    if (format === 'csv') {
      let csv = 'Row,Question Text,Errors\n';
      batch.errorReport.forEach(err => {
        const textEscaped = (err.questionText || '').replace(/"/g, '""');
        const errorsEscaped = err.errors.join('; ').replace(/"/g, '""');
        csv += `${err.row},"${textEscaped}","${errorsEscaped}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=error-report-${batch._id}.csv`);
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      errors: batch.errorReport,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 9. POST /api/admin/question-import/:batchId/rollback ─────────────────────
// @desc  Roll back imported questions from a batch
// @route POST /api/admin/question-import/:batchId/rollback
// @access Private/Admin
export const rollbackImportBatch = async (req, res, next) => {
  try {
    const batch = await QuestionImportBatch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Import batch not found.' });

    if (batch.status !== 'completed') {
      return res.status(400).json({
        message: `Rollback only allowed for completed batches. Current status: ${batch.status}`,
      });
    }

    if (!batch.importedQuestionIds || batch.importedQuestionIds.length === 0) {
      return res.status(400).json({ message: 'No questions to rollback.' });
    }

    const { deletedCount, archivedCount } = await rollbackBatchImports(batch.importedQuestionIds);

    batch.status = 'rolled_back';
    batch.rollbackAllowed = false;
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch rollback completed successfully.',
      deletedCount,
      archivedCount,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 10. GET /api/admin/question-import/templates/:format ─────────────────────
// @desc  Download sample spreadsheet templates for import mapping
// @route GET /api/admin/question-import/templates/:format
// @access Private/Admin
export const getSampleTemplateFile = async (req, res, next) => {
  try {
    const format = req.params.format;
    
    const sampleQuestion = {
      questionText: 'What is the capital city of France?',
      questionHindi: 'फ्रांस की राजधानी क्या है?',
      questionType: 'mcq',
      optionA: 'Berlin',
      optionB: 'Madrid',
      optionC: 'Paris',
      optionD: 'Rome',
      optionAHindi: 'बर्लिन',
      optionBHindi: 'मैड्रिड',
      optionCHindi: 'पेरिस',
      optionDHindi: 'रोम',
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital and most populous city of France.',
      explanationHindi: 'पेरिस फ्रांस की राजधानी और सबसे अधिक आबादी वाला शहर है।',
      marks: 2,
      negativeMarks: 0.66,
      difficulty: 'easy',
      importanceLevel: 'normal',
      language: 'english',
      examSlug: 'upsc',
      phaseSlug: 'prelims',
      subjectSlug: 'geography',
      topicSlug: 'world-geography',
      subtopicSlug: 'european-geography',
      sourceType: 'original_practice',
      sourceName: 'TargetRank Mock Test',
      sourceYear: 2026,
      paperName: 'General Studies Paper 1',
      tags: 'france,geography,capitals'
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=questions_template.json');
      return res.status(200).send(JSON.stringify([sampleQuestion], null, 2));
    }

    if (format === 'csv') {
      const headers = Object.keys(sampleQuestion);
      const values = Object.values(sampleQuestion).map(v => `"${v.toString().replace(/"/g, '""')}"`);
      const csv = `${headers.join(',')}\n${values.join(',')}`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=questions_template.csv');
      return res.status(200).send(csv);
    }

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet([sampleQuestion]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=questions_template.xlsx');
      return res.status(200).send(buf);
    }

    return res.status(400).json({ message: 'Unsupported template format. Use csv, json, or xlsx.' });
  } catch (error) {
    next(error);
  }
};

// ─── 11. POST /api/admin/question-import/:batchId/retry ───────────────────────
// @desc  Retry failed/invalid rows in an import batch
// @route POST /api/admin/question-import/:batchId/retry
// @access Private/Admin
export const retryFailedRows = async (req, res, next) => {
  try {
    const batch = await QuestionImportBatch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Import batch not found.' });

    if (batch.status !== 'completed' && batch.status !== 'failed') {
      return res.status(400).json({
        message: `Retry only allowed for completed/failed batches. Current status: ${batch.status}`,
      });
    }

    batch.status = 'validating';
    await batch.save();

    const rows = await parseImportFile(batch.filePath, batch.fileType);
    const report = await validateQuestions(rows, req.user._id, batch.fieldMapping);

    if (report.validRowsList.length === 0) {
      batch.status = 'failed';
      await batch.save();
      return res.status(400).json({ message: 'Retry validation failed. No valid rows found in file.' });
    }

    // Process background thread import
    runBackgroundCommit(batch._id, report.validRowsList, false, batch.duplicateStance || 'skip');

    res.status(200).json({
      success: true,
      message: 'Retry import triggered successfully in the background.',
      batch,
    });
  } catch (error) {
    next(error);
  }
};



// ─── 9. PATCH /api/admin/questions/:id/approve ────────────────────────────────
// @desc  Approve and verify a question
// @route PATCH /api/admin/questions/:id/approve
// @access Private/Admin
export const approveQuestion = async (req, res, next) => {
  try {
    const { publish } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    question.qualityStatus = 'approved';
    question.isVerified = true;
    question.verifiedBy = req.user._id;
    question.verifiedAt = new Date();

    if (publish !== undefined) {
      question.isPublished = !!publish;
    }

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question approved successfully.',
      question,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 10. PATCH /api/admin/questions/:id/reject ───────────────────────────────
// @desc  Reject a question draft
// @route PATCH /api/admin/questions/:id/reject
// @access Private/Admin
export const rejectQuestion = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ message: 'rejectionReason is required to reject a question.' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    question.qualityStatus = 'rejected';
    question.isPublished = false;
    question.rejectionReason = rejectionReason;

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question rejected successfully.',
      question,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 11. PATCH /api/admin/questions/:id/publish ──────────────────────────────
// @desc  Publish an approved/verified question
// @route PATCH /api/admin/questions/:id/publish
// @access Private/Admin
export const publishQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    if (question.qualityStatus !== 'approved' || !question.isVerified) {
      return res.status(400).json({
        message: 'Only approved and verified questions can be published.',
      });
    }

    question.isPublished = true;
    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question published successfully.',
      question,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 12. PATCH /api/admin/questions/bulk-approve ─────────────────────────────
// @desc  Bulk approve multiple questions
// @route PATCH /api/admin/questions/bulk-approve
// @access Private/Admin
export const bulkApproveQuestions = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Request body must contain ids array.' });
    }

    const result = await Question.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          qualityStatus: 'approved',
          isVerified: true,
          verifiedBy: req.user._id,
          verifiedAt: new Date(),
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully approved ${result.modifiedCount} questions.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 13. PATCH /api/admin/questions/bulk-tag ─────────────────────────────────
// @desc  Bulk tag multiple questions
// @route PATCH /api/admin/questions/bulk-tag
// @access Private/Admin
export const bulkTagQuestions = async (req, res, next) => {
  try {
    const { ids, tags } = req.body;
    if (!ids || !Array.isArray(ids) || !tags || !Array.isArray(tags)) {
      return res.status(400).json({ message: 'Request body must contain ids and tags arrays.' });
    }

    const result = await Question.updateMany(
      { _id: { $in: ids } },
      {
        $addToSet: { tags: { $each: tags } }
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully added tags to ${result.modifiedCount} questions.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 14. PATCH /api/admin/questions/bulk-publish ─────────────────────────────
// @desc  Bulk publish multiple approved questions
// @route PATCH /api/admin/questions/bulk-publish
// @access Private/Admin
export const bulkPublishQuestions = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Request body must contain ids array.' });
    }

    // Only allow publishing questions that are approved/verified
    const result = await Question.updateMany(
      { _id: { $in: ids }, qualityStatus: 'approved', isVerified: true },
      { $set: { isPublished: true } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully published ${result.modifiedCount} approved questions.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};
