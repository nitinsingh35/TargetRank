import fs from 'fs';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';
import Question from '../models/Question.js';
import PracticeSession from '../models/PracticeSession.js';
import QuestionImportBatch from '../models/QuestionImportBatch.js';

// Helper: Normalize duplicateHash parameters
const getNormalizedText = (text) => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
};

// Helper: Get value from row using custom mapping or key match
const getMappedValue = (row, targetField, mapping) => {
  if (mapping && mapping[targetField]) {
    const customKey = mapping[targetField];
    if (row[customKey] !== undefined) return row[customKey];
  }
  // direct match
  if (row[targetField] !== undefined) return row[targetField];
  
  // case-insensitive match
  const targetLower = targetField.toLowerCase();
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().trim() === targetLower) {
      return row[k];
    }
  }
  return undefined;
};

// ── Service: Parse file rows in full or preview limit ───────────────────────
export const parseImportFile = (filePath, fileType, limit = null) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    let rowCount = 0;

    if (fileType === 'json') {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(err);
        try {
          const parsed = JSON.parse(data);
          if (!Array.isArray(parsed)) {
            return reject(new Error('JSON file must contain an array of question objects.'));
          }
          const finalRows = limit ? parsed.slice(0, limit) : parsed;
          resolve(finalRows);
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    } else if (fileType === 'csv') {
      const stream = fs.createReadStream(filePath)
        .pipe(csvParser());

      stream.on('data', (data) => {
        if (limit && rowCount >= limit) {
          stream.destroy();
          return;
        }
        rows.push(data);
        rowCount++;
      });

      stream.on('end', () => {
        resolve(rows);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const finalRows = limit ? parsed.slice(0, limit) : parsed;
        resolve(finalRows);
      } catch (err) {
        reject(err);
      }
    } else {
      reject(new Error('Unsupported file type. Use csv, json, or xlsx.'));
    }
  });
};

// ── Service: Validate rows and check duplicates ─────────────────────────────
export const validateQuestions = async (rows, createdBy, mapping = null) => {
  // Load syllabus catalog mappings into memory to optimize performance
  const [exams, phases, subjects, topics, subtopics] = await Promise.all([
    Exam.find({}).lean(),
    ExamPhase.find({}).lean(),
    Subject.find({}).lean(),
    Topic.find({}).lean(),
    Subtopic.find({}).lean(),
  ]);

  const examMap = new Map(exams.map(e => [e.slug, e]));
  const phaseMap = new Map(phases.map(p => [`${p.examId}_${p.slug}`, p]));
  const subjectMap = new Map(subjects.map(s => [`${s.phaseId}_${s.slug}`, s]));
  const topicMap = new Map(topics.map(t => [`${t.subjectId}_${t.slug}`, t]));
  const subtopicMap = new Map(subtopics.map(st => [`${st.topicId}_${st.slug}`, st]));

  const errorReport = [];
  const validRowsList = [];
  const duplicateRowsHashes = new Set();

  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let missingSyllabusCount = 0;
  let invalidOptionsCount = 0;
  let invalidAnswerCount = 0;
  let missingSourceCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx];
    const rowNum = idx + 1;
    const errors = [];

    const getVal = (field) => getMappedValue(raw, field, mapping);

    // Parse options from CSV columns (optionA, optionB, optionC, optionD) or array directly
    let options = [];
    if (Array.isArray(raw.options)) {
      options = raw.options;
    } else {
      const optA = getVal('optionA');
      const optB = getVal('optionB');
      const optC = getVal('optionC');
      const optD = getVal('optionD');
      
      const optAHindi = getVal('optionAHindi') || '';
      const optBHindi = getVal('optionBHindi') || '';
      const optCHindi = getVal('optionCHindi') || '';
      const optDHindi = getVal('optionDHindi') || '';

      if (optA) options.push({ optionKey: 'A', text: optA.toString().trim(), textHindi: optAHindi.toString().trim() });
      if (optB) options.push({ optionKey: 'B', text: optB.toString().trim(), textHindi: optBHindi.toString().trim() });
      if (optC) options.push({ optionKey: 'C', text: optC.toString().trim(), textHindi: optCHindi.toString().trim() });
      if (optD) options.push({ optionKey: 'D', text: optD.toString().trim(), textHindi: optDHindi.toString().trim() });
    }

    const qText = getVal('questionText') || '';
    const qType = getVal('questionType') || 'mcq';
    const marks = Number(getVal('marks') !== undefined ? getVal('marks') : 2);
    const negMarks = Number(getVal('negativeMarks') !== undefined ? getVal('negativeMarks') : 0.66);
    const lang = getVal('language') || 'english';
    const sType = getVal('sourceType') || 'original_practice';
    const sName = getVal('sourceName') || getVal('sourceExam') || 'Imported Content';
    const sYear = getVal('sourceYear') ? Number(getVal('sourceYear')) : undefined;
    const pName = getVal('paperName') || '';

    const examSlug = (getVal('examCode') || getVal('examSlug') || '').toString().toLowerCase().trim();
    const phaseSlug = (getVal('phaseCode') || getVal('phaseSlug') || '').toString().toLowerCase().trim();
    const subjectSlug = (getVal('subjectCode') || getVal('subjectSlug') || '').toString().toLowerCase().trim();
    const topicSlug = (getVal('topicCode') || getVal('topicSlug') || '').toString().toLowerCase().trim();
    const subtopicSlug = (getVal('subtopicCode') || getVal('subtopicSlug') || '').toString().toLowerCase().trim();

    const diff = getVal('difficulty') || 'medium';
    const importance = getVal('importanceLevel') || 'normal';

    // Core validation checks
    if (!qText.trim()) {
      errors.push('Question text is missing.');
    }

    if (isNaN(marks) || marks < 0) {
      errors.push('Marks must be a non-negative number.');
    }
    if (isNaN(negMarks) || negMarks < 0) {
      errors.push('Negative marks must be a non-negative number.');
    }

    if ((sType === 'official_pyq' || sType === 'previous_year' || getVal('isPreviousYearQuestion') === 'true' || getVal('isPreviousYearQuestion') === true) && (!sYear || !pName.trim())) {
      errors.push('Official PYQs must include sourceYear and paperName.');
    }

    // Question structure checks
    const optionTexts = options.map(o => typeof o === 'string' ? o : o.text);
    if (qType === 'mcq') {
      if (options.length < 2) {
        errors.push('MCQ must contain at least 2 options.');
        invalidOptionsCount++;
      }
      const corrAns = getVal('correctAnswer');
      if (!corrAns || !optionTexts.includes(corrAns.toString().trim())) {
        errors.push('MCQ correctAnswer is missing or must match one of the options text.');
        invalidAnswerCount++;
      }
    } else if (qType === 'multiple_select') {
      let correctAnswers = [];
      const rawCorrectAnswers = getVal('correctAnswers');
      if (Array.isArray(rawCorrectAnswers)) {
        correctAnswers = rawCorrectAnswers;
      } else if (rawCorrectAnswers) {
        correctAnswers = rawCorrectAnswers.split(',').map(a => a.trim());
      } else if (getVal('correctAnswer')) {
        correctAnswers = [getVal('correctAnswer').toString().trim()];
      }
      if (options.length < 2) {
        errors.push('Multiple select question must have at least 2 options.');
        invalidOptionsCount++;
      }
      if (correctAnswers.length < 1) {
        errors.push('Multiple select question must have at least 1 correct answer.');
        invalidAnswerCount++;
      }
      for (const ans of correctAnswers) {
        if (!optionTexts.includes(ans)) {
          errors.push(`Correct answer '${ans}' must match one of the options.`);
        }
      }
    } else if (qType === 'true_false') {
      const corrAns = getVal('correctAnswer');
      if (corrAns !== 'True' && corrAns !== 'False') {
        errors.push('True/False correctAnswer must be "True" or "False".');
        invalidAnswerCount++;
      }
    }

    // Resolve slugs
    const exam = examMap.get(examSlug);
    if (!exam) {
      errors.push(`Exam code/slug '${examSlug}' does not exist.`);
      missingSyllabusCount++;
    }

    let phase = null;
    if (exam) {
      phase = phaseMap.get(`${exam._id}_${phaseSlug}`);
      if (!phase) {
        errors.push(`Exam Stage code/slug '${phaseSlug}' does not exist under this exam.`);
        missingSyllabusCount++;
      }
    }

    let subject = null;
    if (phase) {
      subject = subjectMap.get(`${phase._id}_${subjectSlug}`);
      if (!subject) {
        errors.push(`Subject code/slug '${subjectSlug}' does not exist under this stage.`);
        missingSyllabusCount++;
      }
    }

    let topic = null;
    if (subject) {
      topic = topicMap.get(`${subject._id}_${topicSlug}`);
      if (!topic) {
        errors.push(`Topic code/slug '${topicSlug}' does not exist under this subject.`);
        missingSyllabusCount++;
      }
    }

    let subtopic = null;
    if (topic && subtopicSlug) {
      subtopic = subtopicMap.get(`${topic._id}_${subtopicSlug}`);
      if (!subtopic) {
        errors.push(`Subtopic code/slug '${subtopicSlug}' does not exist under this topic.`);
      }
    }

    // Generate hash parameters
    const normText = getNormalizedText(qText);
    const hash = `${normText}_${exam ? exam._id : ''}_${subject ? subject._id : ''}_${topic ? topic._id : ''}_${sYear || ''}`;

    // Duplicate Check: Inside current file rows list
    if (duplicateRowsHashes.has(hash)) {
      errors.push('Duplicate question found within this file.');
      duplicateCount++;
    } else {
      duplicateRowsHashes.add(hash);
    }

    // Duplicate Check: Against Database entries
    if (exam && subject && topic) {
      const dbExists = await Question.exists({ duplicateHash: hash });
      if (dbExists) {
        errors.push('A question with matching text and metadata already exists in the database.');
        duplicateCount++;
      }
    }

    // Finalize report
    if (errors.length > 0) {
      invalidCount++;
      errorReport.push({
        row: rowNum,
        questionText: qText || '[Empty Question Text]',
        errors,
        warning: false,
      });
    } else {
      validCount++;
      validRowsList.push({
        row: rowNum,
        hash,
        data: {
          examId: exam._id,
          phaseId: phase._id,
          subjectId: subject._id,
          topicId: topic._id,
          subtopicId: subtopic ? subtopic._id : null,
          questionType: qType,
          questionText: qText,
          questionHindi: getVal('questionTextHindi') || getVal('questionHindi') || undefined,
          questionTextHindi: getVal('questionTextHindi') || getVal('questionHindi') || undefined,
          options,
          correctAnswer: qType !== 'multiple_select' && qType !== 'descriptive' && qType !== 'interview' ? getVal('correctAnswer').toString().trim() : undefined,
          correctAnswers: qType === 'multiple_select' ? (Array.isArray(getVal('correctAnswers')) ? getVal('correctAnswers') : (getVal('correctAnswers') ? getVal('correctAnswers').split(',').map(a => a.trim()) : [getVal('correctAnswer').toString().trim()])) : undefined,
          explanation: getVal('explanation') || '',
          explanationHindi: getVal('explanationHindi') || undefined,
          difficulty: diff,
          marks,
          negativeMarks: negMarks,
          language: lang,
          sourceType: sType,
          sourceName: sName,
          sourceExam: getVal('sourceExam') || undefined,
          sourceUrl: getVal('sourceUrl') || undefined,
          sourceYear: sYear,
          paperName: pName || undefined,
          paperCode: getVal('paperCode') || undefined,
          questionNumberInPaper: getVal('questionNumberInPaper') ? Number(getVal('questionNumberInPaper')) : undefined,
          sourceBook: getVal('sourceBook') || undefined,
          sourceChapter: getVal('sourceChapter') || undefined,
          sourceReference: getVal('sourceReference') || undefined,
          copyrightStatus: getVal('copyrightStatus') || 'original',
          isPreviousYearQuestion: getVal('isPreviousYearQuestion') === 'true' || getVal('isPreviousYearQuestion') === true,
          tags: Array.isArray(getVal('tags')) ? getVal('tags') : (getVal('tags') ? getVal('tags').split(',').map(t => t.trim()) : []),
          importanceLevel: importance,
          qualityStatus: 'draft', // Draft by default
          isPublished: false,
          isVerified: false,
          duplicateHash: hash,
          createdBy,
        }
      });
    }
  }

  return {
    validRowsList,
    errorReport,
    counts: {
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
      missingSyllabusRows: missingSyllabusCount,
      invalidOptionsRows: invalidOptionsCount,
      invalidAnswerRows: invalidAnswerCount,
      missingSourceRows: missingSourceCount,
    }
  };
};

// ── Service: Commit imports in chunks of 500 progressively in background ──
export const runBackgroundCommit = async (batchId, validRowsList, publishAfterImport, duplicateStance) => {
  const chunkSize = 500;
  const importedQuestionIds = [];
  
  try {
    const batch = await QuestionImportBatch.findById(batchId);
    if (!batch) return;

    batch.status = 'importing';
    await batch.save();

    for (let i = 0; i < validRowsList.length; i += chunkSize) {
      const chunk = validRowsList.slice(i, i + chunkSize);
      
      const operations = [];
      
      for (const row of chunk) {
        const qId = new mongoose.Types.ObjectId();
        
        const doc = {
          ...row.data,
        };

        if (publishAfterImport) {
          doc.isPublished = true;
          doc.isVerified = true;
          doc.qualityStatus = 'published';
        }

        // Handle duplicateStance policies
        const exists = await Question.findOne({ duplicateHash: row.hash });
        
        if (exists) {
          if (duplicateStance === 'skip') {
            // Skip the question
            continue;
          } else if (duplicateStance === 'replace') {
            // Replace existing question document (reuse ID)
            importedQuestionIds.push(exists._id);
            operations.push({
              updateOne: {
                filter: { _id: exists._id },
                update: { $set: doc },
                upsert: true
              }
            });
            continue;
          } else if (duplicateStance === 'keep_both') {
            // Clear or change hash to prevent key collisions, and save
            doc.duplicateHash = `${row.hash}_keep_both_${Date.now()}_${Math.random()}`;
          }
        }

        doc._id = qId;
        importedQuestionIds.push(qId);
        operations.push({
          insertOne: {
            document: doc
          }
        });
      }

      if (operations.length > 0) {
        await Question.bulkWrite(operations);
      }

      // Update progress in database progressively
      const currentImported = importedQuestionIds.length;
      await QuestionImportBatch.findByIdAndUpdate(batchId, {
        $set: { importedRows: currentImported },
        $push: { importedQuestionIds: { $each: operations.filter(op => op.insertOne).map(op => op.insertOne.document._id) } }
      });
    }

    // Mark completed
    await QuestionImportBatch.findByIdAndUpdate(batchId, {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        importedRows: importedQuestionIds.length,
      }
    });

  } catch (err) {
    console.error('Background commit failed:', err);
    await QuestionImportBatch.findByIdAndUpdate(batchId, {
      $set: { status: 'failed' }
    });
  }
};

// ── Service: Rollback Batch Imports safely ──────────────────────────────────
export const rollbackBatchImports = async (importedQuestionIds) => {
  let deletedCount = 0;
  let archivedCount = 0;

  for (const qId of importedQuestionIds) {
    // Check if the question is already associated to a completed practice/mock session
    const isUsed = await PracticeSession.exists({
      $or: [
        { questionIds: qId },
        { 'questions.questionId': qId }
      ]
    });

    if (isUsed) {
      // Archive/seal safely instead of deleting
      await Question.findByIdAndUpdate(qId, {
        isPublished: false,
        qualityStatus: 'rejected',
        rejectionReason: 'Import rolled back, question was archived because it was referenced in historical attempts.',
      });
      archivedCount++;
    } else {
      // Safe to delete entirely
      await Question.findByIdAndDelete(qId);
      deletedCount++;
    }
  }

  return {
    deletedCount,
    archivedCount,
  };
};
