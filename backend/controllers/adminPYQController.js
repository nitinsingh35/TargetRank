import PYQPaper from '../models/PYQPaper.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Question from '../models/Question.js';
import { validatePYQPaperQuestions } from '../services/pyqPaperSimulatorService.js';

// 1. POST /api/admin/pyq-papers
export const createPYQPaper = async (req, res, next) => {
  try {
    const { title, examId, phaseId, year, paperName, paperType, language, durationMinutes, officialSourceName, officialSourceUrl, officialAnswerKeyUrl, questionIds, instructions, instructionsHindi, defaultNegativeMarks, negativeMarkingEnabled } = req.body;

    if (!examId || !year || !paperName || !paperType || !language || !durationMinutes || !officialSourceName || !officialSourceUrl) {
      return res.status(400).json({ message: 'Missing required fields for PYQ Paper creation.' });
    }

    // Check uniqueness constraint
    const duplicate = await PYQPaper.findOne({ examId, phaseId: phaseId || null, year, paperName, language });
    if (duplicate) {
      return res.status(400).json({ message: 'A PYQ paper with this exam, phase, year, paper name, and language already exists.' });
    }

    const paper = await PYQPaper.create({
      title,
      examId,
      phaseId: phaseId || null,
      year,
      paperName,
      paperType,
      language,
      durationMinutes,
      officialSourceName,
      officialSourceUrl,
      officialAnswerKeyUrl,
      questionIds: questionIds || [],
      instructions,
      instructionsHindi,
      defaultNegativeMarks: defaultNegativeMarks || 0,
      negativeMarkingEnabled: negativeMarkingEnabled || false,
      status: 'draft',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, paper });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/admin/pyq-papers
export const getPYQPapers = async (req, res, next) => {
  try {
    const { examId, phaseId, year, paperType, language, status } = req.query;
    const filter = {};

    if (examId) filter.examId = examId;
    if (phaseId) filter.phaseId = phaseId;
    if (year) filter.year = Number(year);
    if (paperType) filter.paperType = paperType;
    if (language) filter.language = language;
    if (status) filter.status = status;

    const papers = await PYQPaper.find(filter)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .sort({ year: -1, createdAt: -1 })
      .lean();

    res.status(200).json(papers);
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/admin/pyq-papers/:id
export const getPYQPaperDetails = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findById(req.params.id)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .populate({
        path: 'questionIds',
        populate: [{ path: 'subjectId', select: 'title' }, { path: 'topicId', select: 'title' }]
      });

    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found.' });
    }

    res.status(200).json(paper);
  } catch (error) {
    next(error);
  }
};

// 4. PUT /api/admin/pyq-papers/:id
export const updatePYQPaper = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found.' });
    }

    const { title, examId, phaseId, year, paperName, paperType, language, durationMinutes, officialSourceName, officialSourceUrl, officialAnswerKeyUrl, questionIds, instructions, instructionsHindi, defaultNegativeMarks, negativeMarkingEnabled, sourceVerified, attemptLimit } = req.body;

    // Check duplicate compound index if examId/phaseId/year/paperName/language changed
    const needsUniqueCheck = (examId && examId !== paper.examId.toString()) ||
      (phaseId !== undefined && phaseId !== (paper.phaseId ? paper.phaseId.toString() : '')) ||
      (year && Number(year) !== paper.year) ||
      (paperName && paperName !== paper.paperName) ||
      (language && language !== paper.language);

    if (needsUniqueCheck) {
      const duplicate = await PYQPaper.findOne({
        examId: examId || paper.examId,
        phaseId: phaseId !== undefined ? (phaseId || null) : paper.phaseId,
        year: year ? Number(year) : paper.year,
        paperName: paperName || paper.paperName,
        language: language || paper.language,
        _id: { $ne: paper._id }
      });
      if (duplicate) {
        return res.status(400).json({ message: 'A PYQ paper with this exam, phase, year, paper name, and language already exists.' });
      }
    }

    // Update fields
    if (title !== undefined) paper.title = title;
    if (examId !== undefined) paper.examId = examId;
    if (phaseId !== undefined) paper.phaseId = phaseId || null;
    if (year !== undefined) paper.year = Number(year);
    if (paperName !== undefined) paper.paperName = paperName;
    if (paperType !== undefined) paper.paperType = paperType;
    if (language !== undefined) paper.language = language;
    if (durationMinutes !== undefined) paper.durationMinutes = Number(durationMinutes);
    if (officialSourceName !== undefined) paper.officialSourceName = officialSourceName;
    if (officialSourceUrl !== undefined) paper.officialSourceUrl = officialSourceUrl;
    if (officialAnswerKeyUrl !== undefined) paper.officialAnswerKeyUrl = officialAnswerKeyUrl;
    if (questionIds !== undefined) paper.questionIds = questionIds;
    if (instructions !== undefined) paper.instructions = instructions;
    if (instructionsHindi !== undefined) paper.instructionsHindi = instructionsHindi;
    if (defaultNegativeMarks !== undefined) paper.defaultNegativeMarks = Number(defaultNegativeMarks);
    if (negativeMarkingEnabled !== undefined) paper.negativeMarkingEnabled = negativeMarkingEnabled;
    if (attemptLimit !== undefined) paper.attemptLimit = Number(attemptLimit);

    if (sourceVerified !== undefined) {
      paper.sourceVerified = sourceVerified;
      if (sourceVerified) {
        paper.verifiedBy = req.user._id;
        paper.verifiedAt = new Date();
      } else {
        paper.verifiedBy = null;
        paper.verifiedAt = null;
      }
    }

    // Set count / marks from questions list if questions modified
    if (questionIds !== undefined) {
      const questionsList = await Question.find({ _id: { $in: questionIds } }).select('marks').lean();
      paper.totalQuestions = questionsList.length;
      paper.totalMarks = questionsList.reduce((acc, q) => acc + (q.marks || 2), 0);
    }

    await paper.save();
    res.status(200).json({ success: true, paper });
  } catch (error) {
    next(error);
  }
};

// 5. DELETE /api/admin/pyq-papers/:id
export const deletePYQPaper = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found.' });
    }

    const attemptsCount = await MockTestAttempt.countDocuments({ pyqPaperId: paper._id });
    if (attemptsCount > 0) {
      // Paper has attempts, so we archive it instead of deleting
      paper.status = 'archived';
      paper.isPublished = false;
      await paper.save();
      return res.status(200).json({ success: true, archived: true, message: 'PYQ Paper has existing student attempts. It has been archived instead of deleted.' });
    }

    await PYQPaper.deleteOne({ _id: paper._id });
    res.status(200).json({ success: true, archived: false, message: 'PYQ Paper deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// 6. POST /api/admin/pyq-papers/:id/validate
export const validatePYQPaper = async (req, res, next) => {
  try {
    const report = await validatePYQPaperQuestions(req.params.id);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

// 7. POST /api/admin/pyq-papers/:id/publish
export const publishPYQPaper = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found.' });
    }

    if (!paper.sourceVerified) {
      return res.status(400).json({ message: 'A PYQ paper cannot be published unless official source is verified.' });
    }

    const report = await validatePYQPaperQuestions(paper._id);
    if (!report.canPublish) {
      return res.status(400).json({ message: 'Question metadata validation failed. Cannot publish paper.', errors: report.errors });
    }

    paper.status = 'published';
    paper.isPublished = true;
    await paper.save();

    res.status(200).json({ success: true, message: 'PYQ Paper published successfully.', paper });
  } catch (error) {
    next(error);
  }
};

// 8. POST /api/admin/pyq-papers/:id/archive
export const archivePYQPaper = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found.' });
    }

    paper.status = 'archived';
    paper.isPublished = false;
    await paper.save();

    res.status(200).json({ success: true, message: 'PYQ Paper archived successfully.', paper });
  } catch (error) {
    next(error);
  }
};

// 9. POST /api/admin/pyq-papers/:id/duplicate
export const duplicatePYQPaper = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found.' });
    }

    let checkTitle = `${paper.title} (Copy)`;
    let checkPaperName = `${paper.paperName} Copy`;
    let isDupe = true;
    let counter = 1;

    while (isDupe) {
      const match = await PYQPaper.findOne({
        examId: paper.examId,
        phaseId: paper.phaseId,
        year: paper.year,
        paperName: checkPaperName,
        language: paper.language
      });
      if (match) {
        counter++;
        checkTitle = `${paper.title} (Copy ${counter})`;
        checkPaperName = `${paper.paperName} Copy ${counter}`;
      } else {
        isDupe = false;
      }
    }

    const duplicateData = {
      title: checkTitle,
      examId: paper.examId,
      phaseId: paper.phaseId,
      year: paper.year,
      paperName: checkPaperName,
      paperCode: paper.paperCode ? `${paper.paperCode}-COPY` : '',
      paperType: paper.paperType,
      language: paper.language,
      durationMinutes: paper.durationMinutes,
      totalQuestions: paper.totalQuestions,
      totalMarks: paper.totalMarks,
      defaultNegativeMarks: paper.defaultNegativeMarks,
      negativeMarkingEnabled: paper.negativeMarkingEnabled,
      officialSourceName: paper.officialSourceName,
      officialSourceUrl: paper.officialSourceUrl,
      officialAnswerKeyUrl: paper.officialAnswerKeyUrl,
      questionIds: paper.questionIds || [],
      instructions: paper.instructions,
      instructionsHindi: paper.instructionsHindi,
      attemptLimit: paper.attemptLimit,
      status: 'draft',
      isPublished: false,
      sourceVerified: false,
      verifiedBy: null,
      verifiedAt: null,
      createdBy: req.user._id,
    };

    const duplicatePaper = await PYQPaper.create(duplicateData);
    res.status(201).json({ success: true, message: 'PYQ Paper duplicated successfully as editable draft.', paper: duplicatePaper });
  } catch (error) {
    next(error);
  }
};

// 10. GET /api/admin/pyq-papers/:id/analytics
export const getPYQPaperAnalytics = async (req, res, next) => {
  try {
    const paper = await PYQPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'PYQ Paper not found.' });
    }

    const attempts = await MockTestAttempt.find({ pyqPaperId: paper._id, status: 'submitted' }).lean();

    if (attempts.length === 0) {
      return res.status(200).json({
        totalAttempts: 0,
        completionRate: 0,
        averageScore: 0,
        averageAccuracy: 0,
        averageTimeMinutes: 0,
        subjectPerformance: [],
        topicPerformance: [],
        difficultQuestions: [],
      });
    }

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.status === 'submitted').length;
    const completionRate = Number(((completedAttempts / totalAttempts) * 100).toFixed(2));
    const averageScore = Number((attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts).toFixed(2));
    const averageAccuracy = Number((attempts.reduce((acc, a) => acc + a.accuracy, 0) / totalAttempts).toFixed(2));
    const averageTimeMinutes = Math.round(attempts.reduce((acc, a) => acc + a.timeTakenSeconds, 0) / totalAttempts / 60);

    // Track question difficulty (based on student incorrect count)
    const questionStats = new Map();
    // Pre-populate with all linked questions from snapshot
    if (attempts[0]?.questionSnapshot) {
      attempts[0].questionSnapshot.forEach(q => {
        questionStats.set(q.questionId.toString(), {
          questionText: q.questionText,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          total: 0,
        });
      });
    }

    for (const a of attempts) {
      const questionAnswers = a.questions || [];
      const snapshots = a.questionSnapshot || [];
      const snapMap = new Map(snapshots.map(s => [s.questionId.toString(), s]));

      for (const ans of questionAnswers) {
        const qIdStr = ans.questionId.toString();
        const qSnap = snapMap.get(qIdStr);
        if (!qSnap) continue;

        if (!questionStats.has(qIdStr)) {
          questionStats.set(qIdStr, {
            questionText: qSnap.questionText,
            correct: 0,
            incorrect: 0,
            skipped: 0,
            total: 0,
          });
        }

        const stat = questionStats.get(qIdStr);
        stat.total++;
        const selected = ans.selectedAnswer ? ans.selectedAnswer.trim() : '';
        const correct = qSnap.correctAnswer ? qSnap.correctAnswer.trim() : '';

        if (!selected) {
          stat.skipped++;
        } else if (selected === correct) {
          stat.correct++;
        } else {
          stat.incorrect++;
        }
      }
    }

    const difficultQuestions = Array.from(questionStats.entries()).map(([id, info]) => {
      const incorrectRate = info.total > 0 ? (info.incorrect / info.total) * 100 : 0;
      return {
        questionId: id,
        questionText: info.questionText,
        correctCount: info.correct,
        incorrectCount: info.incorrect,
        skippedCount: info.skipped,
        incorrectRate: Number(incorrectRate.toFixed(2)),
      };
    });

    // Sort by incorrect rate descending
    difficultQuestions.sort((a, b) => b.incorrectRate - a.incorrectRate);

    // Subject/topic statistics aggregation
    const subjectMap = new Map();
    const topicMap = new Map();

    for (const a of attempts) {
      const subPerf = a.subjectPerformance || [];
      const topPerf = a.topicPerformance || [];

      for (const s of subPerf) {
        if (!subjectMap.has(s.subjectId)) {
          subjectMap.set(s.subjectId, { subjectName: s.subjectName, totalAcc: 0, count: 0 });
        }
        const ref = subjectMap.get(s.subjectId);
        ref.totalAcc += s.accuracy;
        ref.count++;
      }

      for (const t of topPerf) {
        if (!topicMap.has(t.topicId)) {
          topicMap.set(t.topicId, { topicName: t.topicName, totalAcc: 0, count: 0 });
        }
        const ref = topicMap.get(t.topicId);
        ref.totalAcc += t.accuracy;
        ref.count++;
      }
    }

    const subjectPerformance = Array.from(subjectMap.entries()).map(([id, s]) => ({
      subjectId: id,
      subjectName: s.subjectName,
      averageAccuracy: Number((s.totalAcc / s.count).toFixed(2)),
    }));

    const topicPerformance = Array.from(topicMap.entries()).map(([id, t]) => ({
      topicId: id,
      topicName: t.topicName,
      averageAccuracy: Number((t.totalAcc / t.count).toFixed(2)),
    }));

    res.status(200).json({
      totalAttempts,
      completionRate,
      averageScore,
      averageAccuracy,
      averageTimeMinutes,
      subjectPerformance,
      topicPerformance,
      difficultQuestions: difficultQuestions.slice(0, 5), // top 5 hardest
    });
  } catch (error) {
    next(error);
  }
};
