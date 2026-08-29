import ContentImportBatch from '../models/ContentImportBatch.js';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

// Sub-generator imports
import { generatePolityQuestions } from './generators/polityGenerator.js';
import { generateHistoryQuestions } from './generators/historyGenerator.js';
import { generateGeographyQuestions } from './generators/geographyGenerator.js';
import { generateEconomyQuestions } from './generators/economyGenerator.js';
import { generateEnvironmentQuestions } from './generators/environmentGenerator.js';
import { generateScienceQuestions } from './generators/scienceGenerator.js';
import { generateQuantQuestions } from './generators/quantGenerator.js';
import { generateReasoningQuestions } from './generators/reasoningGenerator.js';
import { generateEnglishQuestions } from './generators/englishGenerator.js';
import { generateBankingQuestions as genBank } from './generators/bankingGenerator.js';
import { generateBiharQuestions } from './generators/biharGkGenerator.js';
import { generateUPQuestions } from './generators/upGkGenerator.js';

import { normalizeText, generateHash, findExactDuplicate } from './generators/duplicateChecker.js';

export const runGeneratorJob = async (batchId, generatorType, count, examId, userId) => {
  const batch = await ContentImportBatch.findById(batchId);
  if (!batch) return;

  try {
    // 1. Set status to processing
    batch.status = 'validating'; // processing -> validating
    await batch.save();

    // Fetch dynamic database mappings
    const exam = await Exam.findById(examId);
    if (!exam) throw new Error('Target Exam not found.');

    const phase = await ExamPhase.findOne({ examId });
    const phaseId = phase ? phase._id : null;

    // Load first subject/topic for mapping
    const subject = await Subject.findOne({ examId });
    const subjectId = subject ? subject._id : null;

    const topic = await Topic.findOne({ examId });
    const topicId = topic ? topic._id : null;

    if (!phaseId || !subjectId || !topicId) {
      throw new Error('Syllabus references (Phase, Subject, Topic) must exist before generating questions.');
    }

    // 2. Execute target generator
    let questionsRaw = [];
    if (generatorType === 'polity') {
      questionsRaw = await generatePolityQuestions(count, examId);
    } else if (generatorType === 'history') {
      questionsRaw = await generateHistoryQuestions(count, examId);
    } else if (generatorType === 'geography') {
      questionsRaw = await generateGeographyQuestions(count, examId);
    } else if (generatorType === 'economy') {
      questionsRaw = await generateEconomyQuestions(count, examId);
    } else if (generatorType === 'environment') {
      questionsRaw = await generateEnvironmentQuestions(count, examId);
    } else if (generatorType === 'science') {
      questionsRaw = await generateScienceQuestions(count, examId);
    } else if (generatorType === 'quant') {
      questionsRaw = generateQuantQuestions(count);
    } else if (generatorType === 'reasoning') {
      questionsRaw = generateReasoningQuestions(count);
    } else if (generatorType === 'english') {
      questionsRaw = generateEnglishQuestions(count);
    } else if (generatorType === 'banking') {
      questionsRaw = await genBank(count, examId);
    } else if (generatorType === 'bihar') {
      questionsRaw = await generateBiharQuestions(count, examId);
    } else if (generatorType === 'up') {
      questionsRaw = await generateUPQuestions(count, examId);
    } else {
      throw new Error(`Unknown generator type: ${generatorType}`);
    }

    batch.totalRows = questionsRaw.length;
    batch.status = 'validating'; // duplicate checking step
    await batch.save();

    // 3. Duplicate and validation check loop
    const validQuestions = [];
    let duplicatesCount = 0;
    let invalidCount = 0;

    for (const q of questionsRaw) {
      // Create hash and normalize
      const normText = normalizeText(q.questionText);
      const hash = generateHash(q.questionText);

      // Verify exact duplicate
      const duplicate = await Question.findOne({ contentHash: hash });
      if (duplicate) {
        duplicatesCount++;
        continue;
      }

      // Add default metadata
      q.examId = examId;
      q.phaseId = phaseId;
      q.subjectId = subjectId;
      q.topicId = topicId;
      q.category = generatorType === 'quant' ? 'Mathematics' : generatorType === 'reasoning' ? 'Reasoning' : generatorType === 'english' ? 'English' : 'General Studies';
      q.language = 'english';
      q.sourceType = 'practice_generated';
      q.verificationStatus = 'unverified';
      q.status = 'pending_review'; // Always pending review initially
      q.createdBy = userId;
      q.normalizedQuestionText = normText;
      q.contentHash = hash;
      q.generationBatchId = batch._id;

      validQuestions.push(q);
    }

    batch.duplicateRows = duplicatesCount;
    batch.validRows = validQuestions.length;
    batch.status = 'importing'; // pending review insertion
    await batch.save();

    // 4. Batch insertion
    if (validQuestions.length > 0) {
      await Question.insertMany(validQuestions);
    }

    // 5. Mark completed
    batch.importedRows = validQuestions.length;
    batch.pendingReviewRows = validQuestions.length;
    batch.status = 'completed';
    batch.completedAt = new Date();
    await batch.save();

  } catch (err) {
    console.error('Generator Job failed:', err);
    batch.status = 'failed';
    batch.errors.push({
      rowNumber: 0,
      message: err.message || 'System error encountered during generation.',
    });
    await batch.save();
  }
};
