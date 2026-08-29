import Question from '../models/Question.js';
import RevisionItem from '../models/RevisionItem.js';
import PreviousYearPaper from '../models/PreviousYearPaper.js';

/**
 * Calculates results for a Previous Year Paper attempt, structures section/subject/topic
 * performance, and upserts revision items for wrong answers.
 * 
 * @param {Object} attempt - The PaperAttempt document
 * @returns {Promise<Object>} - The computed metrics to update the attempt
 */
export async function calculatePaperResult(attempt) {
  try {
    const { answers, userId, paperId } = attempt;

    // Load paper and its questions
    const paper = await PreviousYearPaper.findById(paperId).lean();
    if (!paper) {
      throw new Error('Associated Previous Year Paper not found.');
    }

    const { examId, phaseId, sections = [] } = paper;

    // Load all question details from DB
    const questionIds = paper.questionIds || [];
    const questionsList = await Question.find({ _id: { $in: questionIds } })
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .lean();

    // Create question and snapshot maps for fallback support
    const questionsMap = new Map(questionsList.map(q => [q._id.toString(), q]));
    const snapshotMap = new Map(
      (attempt.questionSnapshot || []).map(q => [q.questionId.toString(), q])
    );

    // Map answer attempts by Question ID for fast lookup
    const answersMap = new Map(
      (answers || []).map(ans => [ans.questionId.toString(), ans])
    );

    // Initialize metrics counters
    let totalMarks = 0;
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    // Map trackers for subject & topic statistics
    const subjectMap = new Map();
    const topicMap = new Map();

    // Trackers for section statistics
    const sectionMap = new Map();
    for (const sec of sections) {
      sectionMap.set(sec.sectionName, {
        sectionName: sec.sectionName,
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        score: 0,
        attempted: 0,
        questionIdSet: new Set((sec.questionIds || []).map(id => id.toString())),
      });
    }

    const incorrectQuestionOps = [];

    // Loop through each question assigned to the paper
    for (const qId of questionIds) {
      const qIdStr = qId.toString();
      let question = questionsMap.get(qIdStr);
      if (!question) {
        const snapshot = snapshotMap.get(qIdStr);
        if (snapshot) {
          question = {
            ...snapshot,
            subjectId: snapshot.subjectId,
            topicId: snapshot.topicId,
          };
        }
      }

      if (!question) {
        continue; // Skip if question data is deleted/missing and no snapshot exists
      }

      const marks = question.marks !== undefined ? question.marks : 2;
      const negativeMarks = question.negativeMarks !== undefined ? question.negativeMarks : 0.66;
      totalMarks += marks;

      // Find user response
      const ansObj = answersMap.get(qIdStr);
      const selectedAnswer = ansObj?.selectedAnswer ? ansObj.selectedAnswer.trim() : '';
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

      // Group section-wise metrics
      for (const [secName, secObj] of sectionMap.entries()) {
        if (secObj.questionIdSet.has(qIdStr)) {
          secObj.total += 1;
          if (status === 'correct') {
            secObj.correct += 1;
            secObj.score += marks;
            secObj.attempted += 1;
          } else if (status === 'incorrect') {
            secObj.incorrect += 1;
            secObj.score -= negativeMarks;
            secObj.attempted += 1;
          } else {
            secObj.skipped += 1;
          }
        }
      }
    }

    // Compute aggregate accuracy
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    // Compute final subject performance array
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

    // Compute final topic performance array
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

    // Compute final section performance array
    const sectionPerformance = Array.from(sectionMap.values()).map(sec => {
      const secAcc = sec.attempted > 0 ? (sec.correct / sec.attempted) * 100 : 0;
      return {
        sectionName: sec.sectionName,
        total: sec.total,
        correct: sec.correct,
        incorrect: sec.incorrect,
        skipped: sec.skipped,
        score: Number(sec.score.toFixed(2)),
        accuracy: Number(secAcc.toFixed(2)),
      };
    });

    // Create RevisionItem records for all incorrect answers
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
              sourceType: 'mock_test',
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
      sectionPerformance,
      subjectPerformance,
      topicPerformance,
    };
  } catch (error) {
    console.error('Error calculating paper results:', error);
    throw error;
  }
}
