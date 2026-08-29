import Question from '../models/Question.js';
import RevisionItem from '../models/RevisionItem.js';

/**
 * Calculates results for a practice session, detects weak topics,
 * upserts revision items for wrong answers, and structures performance metrics.
 * 
 * @param {Object} session - The PracticeSession document or object containing questions
 * @returns {Promise<Object>} - The computed scorecard and detail review report
 */
export async function calculatePracticeResult(session) {
  try {
    const { questions: sessionQuestions, userId, examId, phaseId } = session;

    if (!sessionQuestions || !Array.isArray(sessionQuestions) || sessionQuestions.length === 0) {
      return {
        score: 0,
        totalMarks: 0,
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
        accuracy: 0,
        subjectPerformance: [],
        topicPerformance: [],
        weakTopics: [],
        reviewedQuestions: [],
      };
    }

    // 1. Gather all question details from DB
    const questionIds = sessionQuestions.map(q => q.questionId);
    const questionsList = await Question.find({ _id: { $in: questionIds } })
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();

    // Map questions by ID for fast lookup
    const questionsMap = new Map(questionsList.map(q => [q._id.toString(), q]));

    // Initialize metrics counters
    let totalMarks = 0;
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    // Trackers for subject & topic statistics
    const subjectMap = new Map();
    const topicMap = new Map();

    const reviewedQuestions = [];
    const incorrectQuestionOps = [];

    // 2. Compute performance for each question
    for (const sq of sessionQuestions) {
      const qIdStr = sq.questionId.toString();
      const question = questionsMap.get(qIdStr);

      if (!question) {
        continue; // Skip if question data is deleted/missing
      }

      const marks = question.marks !== undefined ? question.marks : 2;
      const negativeMarks = question.negativeMarks !== undefined ? question.negativeMarks : 0.66;
      totalMarks += marks;

      const selectedAnswer = sq.selectedAnswer ? sq.selectedAnswer.trim() : '';
      const correctAnswer = question.correctAnswer ? question.correctAnswer.trim() : '';

      let status = 'skipped';
      if (!selectedAnswer) {
        skippedCount += 1;
        status = 'skipped';
      } else if (selectedAnswer === correctAnswer) {
        correctCount += 1;
        score += marks;
        status = 'correct';
      } else {
        incorrectCount += 1;
        score -= negativeMarks;
        status = 'incorrect';

        // Prepare RevisionItem upsert operation for incorrect answers
        if (question.subjectId && question.topicId) {
          incorrectQuestionOps.push({
            userId,
            questionId: question._id,
            examId,
            phaseId,
            subjectId: question.subjectId?._id || question.subjectId,
            topicId: question.topicId?._id || question.topicId,
          });
        }
      }

      // Group subject-wise metrics
      const subId = question.subjectId?._id?.toString() || question.subjectId?.toString() || 'unknown_subject';
      const subName = question.subjectId?.title || 'General Studies';
      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subjectId: subId,
          subjectName: subName,
          total: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          score: 0,
          attempted: 0,
        });
      }
      const subStat = subjectMap.get(subId);
      subStat.total += 1;
      if (status === 'correct') {
        subStat.correct += 1;
        subStat.score += marks;
        subStat.attempted += 1;
      } else if (status === 'incorrect') {
        subStat.incorrect += 1;
        subStat.score -= negativeMarks;
        subStat.attempted += 1;
      } else {
        subStat.skipped += 1;
      }

      // Group topic-wise metrics
      const topId = question.topicId?._id?.toString() || question.topicId?.toString() || 'unknown_topic';
      const topName = question.topicId?.title || 'General Concept';
      if (!topicMap.has(topId)) {
        topicMap.set(topId, {
          topicId: topId,
          topicName: topName,
          total: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          score: 0,
          attempted: 0,
        });
      }
      const topStat = topicMap.get(topId);
      topStat.total += 1;
      if (status === 'correct') {
        topStat.correct += 1;
        topStat.score += marks;
        topStat.attempted += 1;
      } else if (status === 'incorrect') {
        topStat.incorrect += 1;
        topStat.score -= negativeMarks;
        topStat.attempted += 1;
      } else {
        topStat.skipped += 1;
      }

      // Append detail report items
      reviewedQuestions.push({
        questionId: question._id,
        questionText: question.questionText,
        options: question.options,
        selectedAnswer: sq.selectedAnswer || '',
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        marks,
        negativeMarks,
        status,
        subject: subName,
        topic: topName,
      });
    }

    // 3. Compute aggregate accuracy
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    // 4. Compute final subject performance array
    const subjectPerformance = Array.from(subjectMap.values()).map(sub => {
      const subAcc = sub.attempted > 0 ? (sub.correct / sub.attempted) * 100 : 0;
      return {
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        total: sub.total,
        correct: sub.correct,
        incorrect: sub.incorrect,
        skipped: sub.skipped,
        score: Number(sub.score.toFixed(2)),
        accuracy: Number(subAcc.toFixed(2)),
      };
    });

    // 5. Compute final topic performance array
    const topicPerformance = Array.from(topicMap.values()).map(top => {
      const topAcc = top.attempted > 0 ? (top.correct / top.attempted) * 100 : 0;
      return {
        topicId: top.topicId,
        topicName: top.topicName,
        total: top.total,
        correct: top.correct,
        incorrect: top.incorrect,
        skipped: top.skipped,
        score: Number(top.score.toFixed(2)),
        accuracy: Number(topAcc.toFixed(2)),
      };
    });

    // 6. Detect weak topics (accuracy below 50%, with at least 2 attempted questions)
    const weakTopics = Array.from(topicMap.values())
      .filter(top => {
        const topAcc = top.attempted > 0 ? (top.correct / top.attempted) * 100 : 0;
        return top.attempted >= 2 && topAcc < 50;
      })
      .map(top => top.topicId);

    // 7. Upsert RevisionItem records for all incorrect answers
    if (incorrectQuestionOps.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

      const upsertPromises = incorrectQuestionOps.map(op => {
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
            }
          },
          { upsert: true, new: true }
        );
      });

      await Promise.all(upsertPromises);
    }

    return {
      score: Number(score.toFixed(2)),
      totalMarks,
      correctCount,
      incorrectCount,
      skippedCount,
      accuracy: Number(accuracy.toFixed(2)),
      subjectPerformance,
      topicPerformance,
      weakTopics,
      reviewedQuestions,
    };
  } catch (error) {
    console.error('Error calculating practice results:', error);
    throw error;
  }
}
