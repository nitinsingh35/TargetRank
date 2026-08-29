import PYQPaper from '../models/PYQPaper.js';
import Question from '../models/Question.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import RevisionItem from '../models/RevisionItem.js';
import mongoose from 'mongoose';

/**
 * 1. validatePYQPaperQuestions(pyqPaperId)
 * Validates all questions linked to a PYQ paper.
 */
export async function validatePYQPaperQuestions(pyqPaperId) {
  try {
    const paper = await PYQPaper.findById(pyqPaperId).lean();
    if (!paper) {
      throw new Error('PYQ Paper not found');
    }

    const linkedIds = paper.questionIds || [];
    const uniqueIds = [...new Set(linkedIds.map(id => id.toString()))];
    
    // Find all questions in DB
    const questions = await Question.find({ _id: { $in: linkedIds } }).lean();
    const qMap = new Map(questions.map(q => [q._id.toString(), q]));

    let missingQuestions = 0;
    let unpublishedQuestions = 0;
    let unverifiedQuestions = 0;
    let archivedQuestions = 0;
    let wrongSourceMetadataQuestions = 0;
    let validCount = 0;
    const errors = [];
    const duplicateQuestionIds = [];

    // Detect duplicates
    const seen = new Set();
    for (const qId of linkedIds) {
      const qIdStr = qId.toString();
      if (seen.has(qIdStr)) {
        duplicateQuestionIds.push(qIdStr);
      }
      seen.add(qIdStr);
    }

    for (const qId of linkedIds) {
      const qIdStr = qId.toString();
      const question = qMap.get(qIdStr);

      if (!question) {
        missingQuestions++;
        errors.push(`Question ID ${qIdStr} does not exist in the database.`);
        continue;
      }

      let hasIssue = false;

      // Quality and publish checks
      if (question.qualityStatus !== 'approved') {
        errors.push(`Question ID ${qIdStr} is not approved (status: ${question.qualityStatus}).`);
        hasIssue = true;
      }
      if (!question.isVerified) {
        unverifiedQuestions++;
        errors.push(`Question ID ${qIdStr} is not verified.`);
        hasIssue = true;
      }
      if (!question.isPublished) {
        unpublishedQuestions++;
        errors.push(`Question ID ${qIdStr} is not published.`);
        hasIssue = true;
      }
      if (question.isArchived || question.qualityStatus === 'archived') {
        archivedQuestions++;
        errors.push(`Question ID ${qIdStr} is archived.`);
        hasIssue = true;
      }

      // Metadata checks
      if (question.sourceType !== 'official_pyq') {
        wrongSourceMetadataQuestions++;
        errors.push(`Question ID ${qIdStr} sourceType is not 'official_pyq' (found: ${question.sourceType}).`);
        hasIssue = true;
      }
      if (question.sourceYear !== paper.year) {
        wrongSourceMetadataQuestions++;
        errors.push(`Question ID ${qIdStr} sourceYear (${question.sourceYear}) does not match paper year (${paper.year}).`);
        hasIssue = true;
      }
      if (question.paperName !== paper.paperName) {
        wrongSourceMetadataQuestions++;
        errors.push(`Question ID ${qIdStr} paperName ('${question.paperName}') does not match paper name ('${paper.paperName}').`);
        hasIssue = true;
      }

      // Answer, marks, subject/topic validation
      if (!question.correctAnswer && (!question.correctAnswers || question.correctAnswers.length === 0)) {
        errors.push(`Question ID ${qIdStr} is missing a correct answer definition.`);
        hasIssue = true;
      }
      if (question.marks === undefined || question.marks === null) {
        errors.push(`Question ID ${qIdStr} does not have marks configured.`);
        hasIssue = true;
      }
      if (!question.subjectId || !question.topicId) {
        errors.push(`Question ID ${qIdStr} lacks subject/topic classification.`);
        hasIssue = true;
      }

      if (!hasIssue) {
        validCount++;
      }
    }

    if (duplicateQuestionIds.length > 0) {
      errors.push(`Paper contains duplicate question references: ${duplicateQuestionIds.join(', ')}`);
    }

    const canPublish = errors.length === 0 && validCount === linkedIds.length && paper.sourceVerified;

    return {
      totalLinked: linkedIds.length,
      validQuestions: validCount,
      missingQuestions,
      unpublishedQuestions,
      unverifiedQuestions,
      archivedQuestions,
      wrongSourceMetadataQuestions,
      duplicateQuestionIds,
      canPublish,
      errors,
    };
  } catch (error) {
    console.error('Error validating PYQ questions:', error);
    throw error;
  }
}

/**
 * 2. createPYQAttempt(pyqPaperId, userId)
 * Starts or resumes a PYQ simulator attempt.
 */
export async function createPYQAttempt(pyqPaperId, userId) {
  try {
    const paper = await PYQPaper.findById(pyqPaperId);
    if (!paper) {
      throw new Error('PYQ paper not found');
    }
    if (!paper.isPublished) {
      throw new Error('This PYQ paper is not published yet.');
    }
    if (!paper.sourceVerified) {
      throw new Error('This PYQ paper is temporarily unavailable because its source is not verified.');
    }

    // Availability validation
    const now = new Date();
    if (paper.availableFrom && now < new Date(paper.availableFrom)) {
      throw new Error('This PYQ paper is not available yet.');
    }
    if (paper.availableUntil && now > new Date(paper.availableUntil)) {
      throw new Error('This PYQ paper has expired.');
    }

    // Check active attempts
    let activeAttempt = await MockTestAttempt.findOne({
      userId,
      pyqPaperId,
      status: { $in: ['created', 'started'] },
    });

    if (activeAttempt) {
      // Resume it: check if expired in the meantime
      if (now > new Date(activeAttempt.expiresAt)) {
        await submitPYQAttempt(activeAttempt._id, userId, true);
      } else {
        return {
          resumed: true,
          attemptId: activeAttempt._id,
          expiresAt: activeAttempt.expiresAt,
        };
      }
    }

    // Check attempt limit
    const completedCount = await MockTestAttempt.countDocuments({
      userId,
      pyqPaperId,
      status: 'submitted',
    });
    if (completedCount >= (paper.attemptLimit || 1)) {
      throw new Error('You have reached the maximum attempt limit for this PYQ paper.');
    }

    // Check question validations
    const validation = await validatePYQPaperQuestions(pyqPaperId);
    if (!validation.canPublish) {
      throw new Error('This PYQ paper is temporarily unavailable because its question validation is incomplete.');
    }

    // Populate questions in order
    const questions = await Question.find({ _id: { $in: paper.questionIds } })
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();

    const qMap = new Map(questions.map(q => [q._id.toString(), q]));
    const orderedQuestions = paper.questionIds.map(id => qMap.get(id.toString())).filter(Boolean);

    // Create Snapshots
    const questionSnapshot = orderedQuestions.map((q, idx) => ({
      questionId: q._id,
      questionText: q.questionText,
      questionTextHindi: q.questionHindi || '',
      options: q.options || [],
      optionsHindi: q.optionsHindi || [],
      correctAnswer: q.correctAnswer || '',
      correctAnswers: q.correctAnswers || [],
      explanation: q.explanation || '',
      explanationHindi: q.explanationHindi || '',
      marks: q.marks !== undefined ? q.marks : 2,
      negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0.66,
      subjectId: q.subjectId?._id || q.subjectId,
      subjectName: q.subjectId?.title || 'General Studies',
      topicId: q.topicId?._id || q.topicId,
      topicName: q.topicId?.title || 'General Concepts',
      sourceType: q.sourceType,
      sourceYear: q.sourceYear,
      paperName: q.paperName,
      questionOrder: idx + 1,
    }));

    const attemptQuestions = questionSnapshot.map(q => ({
      questionId: q.questionId,
      selectedAnswer: '',
      isMarkedForReview: false,
      isBookmarked: false,
      visited: false,
      timeSpentSeconds: 0,
      questionOrder: q.questionOrder,
    }));

    const durationMs = paper.durationMinutes * 60 * 1000;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMs);

    const attempt = await MockTestAttempt.create({
      attemptCategory: 'pyq_paper',
      pyqPaperId: paper._id,
      pyqYear: paper.year,
      pyqPaperName: paper.paperName,
      sourceVerifiedAtAttempt: paper.verifiedAt || new Date(),
      userId,
      examId: paper.examId,
      phaseId: paper.phaseId,
      status: 'started',
      questions: attemptQuestions,
      questionSnapshot,
      currentQuestionIndex: 0,
      startedAt,
      expiresAt,
      totalQuestions: attemptQuestions.length,
      totalMarks: paper.totalMarks || questionSnapshot.reduce((acc, q) => acc + q.marks, 0),
    });

    // Remove answers/explanations from response questions
    const responseQuestions = questionSnapshot.map(q => {
      const qCopy = { ...q };
      delete qCopy.correctAnswer;
      delete qCopy.correctAnswers;
      delete qCopy.explanation;
      delete qCopy.explanationHindi;
      return qCopy;
    });

    return {
      resumed: false,
      attemptId: attempt._id,
      questions: responseQuestions,
      expiresAt: attempt.expiresAt,
      durationMinutes: paper.durationMinutes,
    };
  } catch (error) {
    console.error('Error starting PYQ attempt:', error);
    throw error;
  }
}

/**
 * 3. getPYQAttempt(attemptId, userId)
 * Resumes an active attempt. Auto-submits if expired.
 */
export async function getPYQAttempt(attemptId, userId) {
  try {
    const attempt = await MockTestAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.status !== 'started' && attempt.status !== 'created') {
      throw new Error('Attempt is not active.');
    }

    const now = new Date();
    if (now > new Date(attempt.expiresAt)) {
      await submitPYQAttempt(attemptId, userId, true);
      const submitted = await MockTestAttempt.findById(attemptId).lean();
      return { submitted: true, attempt: submitted };
    }

    // Strip answers from snapshots
    const responseQuestions = (attempt.questionSnapshot || []).map(q => {
      const qCopy = { ...q };
      delete qCopy.correctAnswer;
      delete qCopy.correctAnswers;
      delete qCopy.explanation;
      delete qCopy.explanationHindi;
      return qCopy;
    });

    return {
      submitted: false,
      attempt,
      questions: responseQuestions,
    };
  } catch (error) {
    console.error('Error fetching PYQ attempt:', error);
    throw error;
  }
}

/**
 * 4. savePYQAnswer(attemptId, userId, payload)
 * Saves aspirant response for a question.
 */
export async function savePYQAnswer(attemptId, userId, payload) {
  try {
    const { questionId, selectedAnswer, isMarkedForReview, timeSpentSeconds, currentQuestionIndex } = payload;
    const attempt = await MockTestAttempt.findOne({ _id: attemptId, userId });
    
    if (!attempt) {
      throw new Error('Attempt not found');
    }
    if (attempt.status !== 'started') {
      throw new Error('Cannot edit a submitted or inactive attempt.');
    }

    // Check expiry
    const now = new Date();
    if (now > new Date(attempt.expiresAt)) {
      await submitPYQAttempt(attemptId, userId, true);
      throw new Error('This attempt has expired and was auto-submitted.');
    }

    const answerEntry = attempt.questions.find(q => q.questionId.toString() === questionId.toString());
    if (!answerEntry) {
      throw new Error('Question is not part of this paper attempt.');
    }

    // Validate options
    const snapshot = attempt.questionSnapshot.find(q => q.questionId.toString() === questionId.toString());
    if (selectedAnswer && snapshot && snapshot.options && snapshot.options.length > 0) {
      if (!snapshot.options.includes(selectedAnswer)) {
        throw new Error('Selected answer is not one of the available options.');
      }
    }

    // Save details
    answerEntry.selectedAnswer = selectedAnswer === null ? '' : (selectedAnswer || '');
    answerEntry.visited = true;
    answerEntry.answerSavedAt = new Date();
    
    if (isMarkedForReview !== undefined) {
      answerEntry.isMarkedForReview = isMarkedForReview;
    }
    if (timeSpentSeconds !== undefined) {
      answerEntry.timeSpentSeconds = (answerEntry.timeSpentSeconds || 0) + timeSpentSeconds;
    }
    if (currentQuestionIndex !== undefined) {
      attempt.currentQuestionIndex = currentQuestionIndex;
    }

    await attempt.save();
    return { success: true };
  } catch (error) {
    console.error('Error saving PYQ answer:', error);
    throw error;
  }
}

/**
 * 5. submitPYQAttempt(attemptId, userId, autoSubmitted)
 * Grades a PYQ paper attempt.
 */
export async function submitPYQAttempt(attemptId, userId, autoSubmitted = false) {
  try {
    const attempt = await MockTestAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      throw new Error('Attempt not found');
    }
    if (attempt.status === 'submitted') {
      return attempt;
    }

    const answers = attempt.questions || [];
    const snapshots = attempt.questionSnapshot || [];
    const snapMap = new Map(snapshots.map(s => [s.questionId.toString(), s]));

    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let timeTakenSeconds = 0;
    let negativeMarkingImpact = 0;

    const subjectMap = new Map();
    const topicMap = new Map();
    const incorrectOps = [];

    for (const ans of answers) {
      const qIdStr = ans.questionId.toString();
      const qSnap = snapMap.get(qIdStr);
      if (!qSnap) continue;

      const marks = qSnap.marks !== undefined ? qSnap.marks : 2;
      const negativeMarks = qSnap.negativeMarks !== undefined ? qSnap.negativeMarks : 0.66;
      
      totalMarks += marks;
      timeTakenSeconds += ans.timeSpentSeconds || 0;

      const selected = ans.selectedAnswer ? ans.selectedAnswer.trim() : '';
      const correct = qSnap.correctAnswer ? qSnap.correctAnswer.trim() : '';

      let status = 'skipped';
      if (!selected) {
        skippedCount++;
        status = 'skipped';
      } else if (selected === correct) {
        correctCount++;
        score += marks;
        status = 'correct';
      } else {
        incorrectCount++;
        score -= negativeMarks;
        negativeMarkingImpact += negativeMarks;
        status = 'incorrect';

        // Prepare RevisionItem upsert
        if (qSnap.subjectId && qSnap.topicId) {
          incorrectOps.push({
            userId,
            questionId: qSnap.questionId,
            examId: attempt.examId,
            phaseId: attempt.phaseId,
            subjectId: qSnap.subjectId,
            topicId: qSnap.topicId,
          });
        }
      }

      // Track Subject Stats
      const subId = qSnap.subjectId?.toString() || 'unknown_subject';
      const subName = qSnap.subjectName || 'General Studies';
      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, { subjectId: subId, subjectName: subName, total: 0, correct: 0, incorrect: 0, skipped: 0, score: 0, attempted: 0 });
      }
      const subStat = subjectMap.get(subId);
      subStat.total++;
      if (status === 'correct') {
        subStat.correct++;
        subStat.score += marks;
        subStat.attempted++;
      } else if (status === 'incorrect') {
        subStat.incorrect++;
        subStat.score -= negativeMarks;
        subStat.attempted++;
      } else {
        subStat.skipped++;
      }

      // Track Topic Stats
      const topId = qSnap.topicId?.toString() || 'unknown_topic';
      const topName = qSnap.topicName || 'General Concepts';
      if (!topicMap.has(topId)) {
        topicMap.set(topId, { topicId: topId, topicName: topName, total: 0, correct: 0, incorrect: 0, skipped: 0, score: 0, attempted: 0 });
      }
      const topStat = topicMap.get(topId);
      topStat.total++;
      if (status === 'correct') {
        topStat.correct++;
        topStat.score += marks;
        topStat.attempted++;
      } else if (status === 'incorrect') {
        topStat.incorrect++;
        topStat.score -= negativeMarks;
        topStat.attempted++;
      } else {
        topStat.skipped++;
      }
    }

    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    const subjectPerformance = Array.from(subjectMap.values()).map(s => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      total: s.total,
      correct: s.correct,
      incorrect: s.incorrect,
      skipped: s.skipped,
      score: Number(s.score.toFixed(2)),
      accuracy: s.attempted > 0 ? Number(((s.correct / s.attempted) * 100).toFixed(2)) : 0,
    }));

    const topicPerformance = Array.from(topicMap.values()).map(t => ({
      topicId: t.topicId,
      topicName: t.topicName,
      total: t.total,
      correct: t.correct,
      incorrect: t.incorrect,
      skipped: t.skipped,
      score: Number(t.score.toFixed(2)),
      accuracy: t.attempted > 0 ? Number(((t.correct / t.attempted) * 100).toFixed(2)) : 0,
    }));

    // Update Attempt document
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.autoSubmitted = autoSubmitted;
    attempt.score = Number(score.toFixed(2));
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.skippedCount = skippedCount;
    attempt.accuracy = Number(accuracy.toFixed(2));
    attempt.timeTakenSeconds = timeTakenSeconds;
    attempt.subjectPerformance = subjectPerformance;
    attempt.topicPerformance = topicPerformance;
    attempt.resultGenerated = true;
    
    // Add negative marking impact metric in a flexible selectionSummary field or top-level metadata
    attempt.selectionSummary = {
      negativeMarkingImpact: Number(negativeMarkingImpact.toFixed(2)),
    };

    await attempt.save();

    // Create revision items for wrong answers
    if (incorrectOps.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const revisionPromises = incorrectOps.map(op => {
        return RevisionItem.findOneAndUpdate(
          { userId: op.userId, questionId: op.questionId },
          {
            $setOnInsert: {
              userId: op.userId,
              questionId: op.questionId,
              examId: op.examId,
              phaseId: op.phaseId,
              subjectId: op.subjectId,
              topicId: op.topicId,
              sourceType: 'wrong_answer',
            },
            $set: {
              priority: 'high',
              status: 'pending',
              nextRevisionDate: tomorrow,
            },
          },
          { upsert: true, new: true }
        );
      });
      await Promise.all(revisionPromises);
    }

    return attempt;
  } catch (error) {
    console.error('Error submitting PYQ attempt:', error);
    throw error;
  }
}

/**
 * 6. getPYQResult(attemptId, userId)
 * Fetches submitted attempt scorecard.
 */
export async function getPYQResult(attemptId, userId) {
  try {
    const attempt = await MockTestAttempt.findOne({ _id: attemptId, userId }).lean();
    if (!attempt) {
      throw new Error('Attempt not found');
    }
    if (attempt.status !== 'submitted') {
      throw new Error('Result is not available yet (test is active).');
    }

    const paper = await PYQPaper.findById(attempt.pyqPaperId).lean();
    
    // Map answers by Question ID
    const answerMap = new Map((attempt.questions || []).map(a => [a.questionId.toString(), a]));

    // Build question reviews with correct answers and explanations
    const questionReview = (attempt.questionSnapshot || []).map(q => {
      const ans = answerMap.get(q.questionId.toString());
      const selected = ans ? ans.selectedAnswer : '';
      const correct = q.correctAnswer;
      let status = 'skipped';
      if (selected) {
        status = selected === correct ? 'correct' : 'incorrect';
      }

      return {
        questionId: q.questionId,
        questionText: q.questionText,
        questionTextHindi: q.questionTextHindi,
        options: q.options,
        optionsHindi: q.optionsHindi,
        selectedAnswer: selected,
        correctAnswer: correct,
        explanation: q.explanation,
        explanationHindi: q.explanationHindi,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        status,
        subjectId: q.subjectId,
        subjectName: q.subjectName,
        topicId: q.topicId,
        topicName: q.topicName,
        sourceYear: q.sourceYear,
        paperName: q.paperName,
        isBookmarked: ans ? ans.isBookmarked : false,
      };
    });

    // Rule-based feedback
    let feedbackMessage = 'Good job completing the previous year paper!';
    if (attempt.accuracy >= 85) {
      feedbackMessage = 'Outstanding performance! You show excellent mastery over this paper\'s topics.';
    } else if (attempt.accuracy >= 70) {
      feedbackMessage = 'Very strong attempt. Focus on revising minor gaps to boost your accuracy further.';
    } else if (attempt.accuracy >= 50) {
      feedbackMessage = 'Decent attempt, but there is substantial room to grow. Revise your mistake notebook.';
    } else {
      feedbackMessage = 'Low score. You need to deep-dive into subject concepts and practice more topics.';
    }

    // Suggested revision topics: topics where accuracy is below 60%
    const suggestedRevisionTopics = (attempt.topicPerformance || [])
      .filter(t => t.accuracy < 60)
      .map(t => ({
        topicId: t.topicId,
        topicName: t.topicName,
        accuracy: t.accuracy,
      }));

    return {
      paper,
      scoreSummary: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        skippedCount: attempt.skippedCount,
        accuracy: attempt.accuracy,
        timeTakenSeconds: attempt.timeTakenSeconds,
        negativeMarkingImpact: attempt.selectionSummary?.negativeMarkingImpact || 0,
      },
      subjectPerformance: attempt.subjectPerformance || [],
      topicPerformance: attempt.topicPerformance || [],
      questionReview,
      feedbackMessage,
      suggestedRevisionTopics,
      submittedAt: attempt.submittedAt,
    };
  } catch (error) {
    console.error('Error fetching PYQ result:', error);
    throw error;
  }
}

/**
 * 7. getPYQComparison(userId, examId, phaseId)
 * Returns comparative trend analysis for an aspirant.
 */
export async function getPYQComparison(userId, examId, phaseId) {
  try {
    // Build flexible filter: examId and phaseId are optional
    const filter = {
      userId,
      attemptCategory: 'pyq_paper',
      status: 'submitted',
    };
    if (examId) filter.examId = examId;
    if (phaseId) filter.phaseId = phaseId;

    const rawAttempts = await MockTestAttempt.find(filter)
      .populate('examId', 'title')
      .populate('pyqPaperId', 'title paperName year paperType')
      .sort({ submittedAt: 1 })
      .lean();

    // Map attempts to flat shape for frontend
    const attempts = rawAttempts.map(a => ({
      _id: a._id,
      paperTitle: a.pyqPaperId?.title || a.pyqMeta?.paperName || '—',
      examTitle: a.examId?.title || '—',
      year: a.pyqPaperId?.year || a.pyqMeta?.year,
      paperType: a.pyqPaperId?.paperType,
      scorePercentage: a.scorePercentage || a.accuracy || 0,
      score: a.score,
      totalMarks: a.totalMarks,
      correct: a.correctCount,
      wrong: a.incorrectCount,
      skipped: a.skippedCount,
      totalQuestions: a.totalQuestions,
      timeTakenMinutes: a.timeTakenMinutes || (a.timeTakenSeconds ? Math.round(a.timeTakenSeconds / 60) : null),
      submittedAt: a.submittedAt,
    }));

    // Overall stats
    const scores = attempts.map(a => a.scorePercentage || 0);
    const overall = {
      totalAttempts: attempts.length,
      avgScore: scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0,
      bestScore: scores.length ? Math.max(...scores) : 0,
      uniquePapers: new Set(rawAttempts.map(a => (a.pyqPaperId?._id || a.pyqPaperId)?.toString()).filter(Boolean)).size,
    };

    // Year-wise breakdown
    const yearMap = new Map();
    for (const a of attempts) {
      const yr = a.year || 'Unknown';
      if (!yearMap.has(yr)) yearMap.set(yr, { year: yr, attempts: 0, total: 0 });
      const y = yearMap.get(yr);
      y.attempts += 1;
      y.total += a.scorePercentage || 0;
    }
    const yearWise = Array.from(yearMap.values())
      .map(y => ({ ...y, avgScore: y.attempts > 0 ? Number((y.total / y.attempts).toFixed(1)) : 0 }))
      .sort((a, b) => (b.year > a.year ? 1 : -1));

    // Subject-wise accuracy across all attempts
    const subjectMap = new Map();
    for (const a of rawAttempts) {
      for (const s of (a.subjectPerformance || [])) {
        const key = s.subjectId?.toString() || s.subjectName;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, { subject: s.subjectName || key, correct: 0, total: 0 });
        }
        const entry = subjectMap.get(key);
        entry.correct += s.correct || 0;
        entry.total += s.total || 0;
      }
    }
    const subjectTrends = Array.from(subjectMap.values())
      .map(s => ({ ...s, accuracy: s.total > 0 ? Number(((s.correct / s.total) * 100).toFixed(1)) : 0 }))
      .sort((a, b) => b.accuracy - a.accuracy);

    return { attempts, overall, yearWise, subjectTrends };
  } catch (error) {
    console.error('Error fetching PYQ comparison analytics:', error);
    throw error;
  }
}


