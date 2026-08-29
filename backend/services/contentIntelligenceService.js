/**
 * contentIntelligenceService.js
 *
 * The central "brain" of TargetRank's Content Intelligence Layer.
 * Powers:
 *  • Syllabus Coverage Engine
 *  • Content Health Dashboard
 *  • Missing Content Detector
 *  • Auto Mock Builder
 *  • Recommendation Engine
 *  • Admin Analytics
 */

import mongoose from 'mongoose';
import Question          from '../models/Question.js';
import Exam              from '../models/Exam.js';
import ExamPhase         from '../models/ExamPhase.js';
import Subject           from '../models/Subject.js';
import Topic             from '../models/Topic.js';
import Subtopic          from '../models/Subtopic.js';
import Tutorial          from '../models/Tutorial.js';
import PracticeSession   from '../models/PracticeSession.js';
import UserQuestionHistory from '../models/UserQuestionHistory.js';
import TopicWeightage    from '../models/TopicWeightage.js';
import QuestionImportBatch from '../models/QuestionImportBatch.js';
import RevisionItem      from '../models/RevisionItem.js';

// ─────────────────────────────────────────────────────────────
// HELPER: convert string/array of ids to ObjectIds
// ─────────────────────────────────────────────────────────────
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
};

// ─────────────────────────────────────────────────────────────
// 1. SYLLABUS COVERAGE ENGINE
// ─────────────────────────────────────────────────────────────
/**
 * Compute per-topic, per-subject, per-phase, per-exam question coverage.
 * Returns a nested tree: Exam → Phase → Subject → Topic with counts.
 *
 * Coverage % = (publishedQuestions / max(topicsInSubject * 20, 1)) * 100
 * (We use a target of 20 good published Qs per topic as the 100% mark,
 *  but cap at 100.)
 */
export const computeSyllabusCoverage = async (examId = null) => {
  // Build base match for questions
  const qMatch = {};
  if (examId) qMatch.examId = toObjectId(examId);

  // Aggregate question counts grouped by examId / phaseId / subjectId / topicId
  const [qAgg, tutAgg] = await Promise.all([
    Question.aggregate([
      { $match: qMatch },
      {
        $group: {
          _id: {
            examId:    '$examId',
            phaseId:   '$phaseId',
            subjectId: '$subjectId',
            topicId:   '$topicId',
          },
          total:        { $sum: 1 },
          published:    { $sum: { $cond: ['$isPublished', 1, 0] } },
          draft:        { $sum: { $cond: [{ $eq: ['$isPublished', false] }, 1, 0] } },
          pyq:          { $sum: { $cond: ['$isPreviousYearQuestion', 1, 0] } },
          currentAffairs: { $sum: { $cond: [{ $eq: ['$sourceType', 'current_affairs'] }, 1, 0] } },
          mock:         { $sum: { $cond: [{ $eq: ['$sourceType', 'mock'] }, 1, 0] } },
        },
      },
    ]),
    Tutorial.aggregate([
      ...(examId ? [{ $match: { examId: toObjectId(examId) } }] : []),
      {
        $group: {
          _id: {
            examId:    '$examId',
            subjectId: '$subjectId',
            topicId:   '$topicId',
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Build lookup maps
  const qMap = new Map();    // key: `examId_phaseId_subjectId_topicId`
  for (const r of qAgg) {
    const k = `${r._id.examId}_${r._id.phaseId}_${r._id.subjectId}_${r._id.topicId}`;
    qMap.set(k, r);
  }

  const tutMap = new Map(); // key: `examId_subjectId_topicId`
  for (const r of tutAgg) {
    const k = `${r._id.examId}_${r._id.subjectId}_${r._id.topicId}`;
    tutMap.set(k, r.count);
  }

  // Load syllabus tree
  const examQuery = examId ? { _id: toObjectId(examId) } : {};
  const [exams, phases, subjects, topics] = await Promise.all([
    Exam.find(examQuery).lean(),
    ExamPhase.find(examId ? { examId: toObjectId(examId) } : {}).lean(),
    Subject.find(examId ? { examId: toObjectId(examId) } : {}).lean(),
    Topic.find(examId ? { examId: toObjectId(examId) } : {}).lean(),
  ]);

  const phaseMap     = new Map(phases.map(p => [p._id.toString(), p]));
  const subjectsByPhase = new Map();
  const topicsBySubject = new Map();

  for (const s of subjects) {
    const key = s.phaseId?.toString();
    if (!subjectsByPhase.has(key)) subjectsByPhase.set(key, []);
    subjectsByPhase.get(key).push(s);
  }
  for (const t of topics) {
    const key = t.subjectId?.toString();
    if (!topicsBySubject.has(key)) topicsBySubject.set(key, []);
    topicsBySubject.get(key).push(t);
  }

  // Build output tree
  const tree = exams.map(exam => {
    const examPhases = phases
      .filter(p => p.examId?.toString() === exam._id.toString())
      .map(phase => {
        const phaseSubjects = (subjectsByPhase.get(phase._id.toString()) || []).map(subject => {
          const subjectTopics = (topicsBySubject.get(subject._id.toString()) || []).map(topic => {
            const k   = `${exam._id}_${phase._id}_${subject._id}_${topic._id}`;
            const tut = tutMap.get(`${exam._id}_${subject._id}_${topic._id}`) || 0;
            const qr  = qMap.get(k) || { total: 0, published: 0, draft: 0, pyq: 0, currentAffairs: 0, mock: 0 };

            const coveragePct = Math.min(100, Math.round((qr.published / 20) * 100));
            return {
              topicId:    topic._id,
              title:      topic.title,
              total:      qr.total,
              published:  qr.published,
              draft:      qr.draft,
              pyq:        qr.pyq,
              currentAffairs: qr.currentAffairs,
              mock:       qr.mock,
              tutorials:  tut,
              coveragePct,
              status: coveragePct === 0 ? 'missing' : coveragePct < 30 ? 'low' : coveragePct < 70 ? 'medium' : 'good',
            };
          });

          const subTotal     = subjectTopics.reduce((s, t) => s + t.total, 0);
          const subPublished = subjectTopics.reduce((s, t) => s + t.published, 0);
          const subPyq       = subjectTopics.reduce((s, t) => s + t.pyq, 0);
          const subTutorials = subjectTopics.reduce((s, t) => s + t.tutorials, 0);
          const subCov       = subjectTopics.length
            ? Math.round(subjectTopics.reduce((s, t) => s + t.coveragePct, 0) / subjectTopics.length)
            : 0;

          return {
            subjectId:  subject._id,
            title:      subject.title,
            topicCount: subjectTopics.length,
            total:      subTotal,
            published:  subPublished,
            pyq:        subPyq,
            tutorials:  subTutorials,
            coveragePct: subCov,
            topics:     subjectTopics,
          };
        });

        const phTotal     = phaseSubjects.reduce((s, sb) => s + sb.total, 0);
        const phPublished = phaseSubjects.reduce((s, sb) => s + sb.published, 0);
        const phCov       = phaseSubjects.length
          ? Math.round(phaseSubjects.reduce((s, sb) => s + sb.coveragePct, 0) / phaseSubjects.length)
          : 0;

        return {
          phaseId:  phase._id,
          title:    phase.title,
          total:    phTotal,
          published: phPublished,
          coveragePct: phCov,
          subjects: phaseSubjects,
        };
      });

    const exTotal     = examPhases.reduce((s, ph) => s + ph.total, 0);
    const exPublished = examPhases.reduce((s, ph) => s + ph.published, 0);
    const exCov       = examPhases.length
      ? Math.round(examPhases.reduce((s, ph) => s + ph.coveragePct, 0) / examPhases.length)
      : 0;

    return {
      examId:   exam._id,
      title:    exam.title,
      slug:     exam.slug,
      total:    exTotal,
      published: exPublished,
      coveragePct: exCov,
      phases:   examPhases,
    };
  });

  return tree;
};

// ─────────────────────────────────────────────────────────────
// 2. CONTENT HEALTH DASHBOARD
// ─────────────────────────────────────────────────────────────
export const computeContentHealth = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalQuestions,
    publishedCount,
    pendingReview,
    recentlyAdded,
    recentlyUpdated,
    allTopics,
    topicsWithQuestions,
  ] = await Promise.all([
    Question.countDocuments({}),
    Question.countDocuments({ isPublished: true }),
    Question.countDocuments({ qualityStatus: 'pending' }),
    Question.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Question.countDocuments({ updatedAt: { $gte: sevenDaysAgo } }),
    Topic.countDocuments({}),
    Question.distinct('topicId'),
  ]);

  const missingTopics   = allTopics - topicsWithQuestions.length;
  const coveragePct     = allTopics > 0
    ? Math.round((topicsWithQuestions.length / allTopics) * 100)
    : 0;

  // Subjects with no questions
  const allSubjects         = await Subject.countDocuments({});
  const subjectsWithQs      = await Question.distinct('subjectId');
  const subjectsWithNoQs    = allSubjects - subjectsWithQs.length;

  // Low coverage topics (< 5 published questions)
  const lowCoverageAgg = await Question.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$topicId', count: { $sum: 1 } } },
    { $match: { count: { $lt: 5 } } },
    { $count: 'lowCount' },
  ]);
  const lowCoverageTopics = lowCoverageAgg[0]?.lowCount || 0;

  // Top 10 used topics (by practice session question count)
  const topUsedAgg = await PracticeSession.aggregate([
    { $unwind: '$questions' },
    { $group: { _id: '$questions.topicId', usageCount: { $sum: 1 } } },
    { $sort: { usageCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'topics', localField: '_id', foreignField: '_id', as: 'topic',
      },
    },
    { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
    { $project: { topicId: '$_id', topicName: { $ifNull: ['$topic.title', 'Unknown'] }, usageCount: 1, _id: 0 } },
  ]);

  // Bottom 10 topics with fewest published questions  
  const leastUsedAgg = await Question.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$topicId', count: { $sum: 1 } } },
    { $sort: { count: 1 } },
    { $limit: 10 },
    {
      $lookup: { from: 'topics', localField: '_id', foreignField: '_id', as: 'topic' },
    },
    { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
    { $project: { topicId: '$_id', topicName: { $ifNull: ['$topic.title', 'Unknown'] }, count: 1, _id: 0 } },
  ]);

  return {
    totalQuestions,
    publishedCount,
    coveragePct,
    missingTopics,
    lowCoverageTopics,
    subjectsWithNoQuestions: subjectsWithNoQs,
    pendingReview,
    recentlyAdded,
    recentlyUpdated,
    topUsedTopics:   topUsedAgg,
    leastUsedTopics: leastUsedAgg,
  };
};

// ─────────────────────────────────────────────────────────────
// 3. MISSING CONTENT DETECTOR
// ─────────────────────────────────────────────────────────────
export const detectMissingContent = async (examId = null) => {
  const topicQuery = examId ? { examId: toObjectId(examId) } : {};
  const allTopics  = await Topic.find(topicQuery)
    .populate('examId', 'title slug')
    .populate('subjectId', 'title')
    .lean();

  // Gather question / tutorial counts per topic
  const [qCounts, tutCounts, pyqCounts, interviewCounts] = await Promise.all([
    Question.aggregate([
      ...(examId ? [{ $match: { examId: toObjectId(examId) } }] : []),
      { $group: { _id: '$topicId', total: { $sum: 1 }, pyq: { $sum: { $cond: ['$isPreviousYearQuestion', 1, 0] } } } },
    ]),
    Tutorial.aggregate([
      ...(examId ? [{ $match: { examId: toObjectId(examId) } }] : []),
      { $group: { _id: '$topicId', count: { $sum: 1 } } },
    ]),
    Question.aggregate([
      ...(examId ? [{ $match: { examId: toObjectId(examId) } }] : []),
      { $match: { isPreviousYearQuestion: true } },
      { $group: { _id: '$topicId', count: { $sum: 1 } } },
    ]),
    Question.aggregate([
      ...(examId ? [{ $match: { examId: toObjectId(examId) } }] : []),
      { $match: { questionType: 'interview' } },
      { $group: { _id: '$topicId', count: { $sum: 1 } } },
    ]),
  ]);

  const qMap         = new Map(qCounts.map(r => [r._id?.toString(), r]));
  const tutMap       = new Map(tutCounts.map(r => [r._id?.toString(), r.count]));
  const pyqMap       = new Map(pyqCounts.map(r => [r._id?.toString(), r.count]));
  const interviewMap = new Map(interviewCounts.map(r => [r._id?.toString(), r.count]));

  const report = allTopics
    .map(t => {
      const tid     = t._id.toString();
      const qr      = qMap.get(tid) || { total: 0, pyq: 0 };
      const tuts    = tutMap.get(tid) || 0;
      const pyqs    = pyqMap.get(tid) || 0;
      const ints    = interviewMap.get(tid) || 0;

      const missing = [];
      if (qr.total === 0) missing.push('questions');
      if (tuts === 0)     missing.push('tutorials');
      if (pyqs === 0)     missing.push('pyqs');
      if (ints === 0)     missing.push('interview');

      return {
        topicId:   t._id,
        title:     t.title,
        examTitle: t.examId?.title || '',
        examSlug:  t.examId?.slug  || '',
        subject:   t.subjectId?.title || '',
        questions: qr.total,
        tutorials: tuts,
        pyqs,
        interview: ints,
        missing,
        missingCount: missing.length,
      };
    })
    .filter(t => t.missingCount > 0)
    .sort((a, b) => b.missingCount - a.missingCount);

  const summary = {
    topicsWithNoQuestions:   report.filter(t => t.missing.includes('questions')).length,
    topicsWithNoTutorials:   report.filter(t => t.missing.includes('tutorials')).length,
    topicsWithNoPYQs:        report.filter(t => t.missing.includes('pyqs')).length,
    topicsWithNoInterview:   report.filter(t => t.missing.includes('interview')).length,
    total:                   report.length,
  };

  return { summary, report };
};

// ─────────────────────────────────────────────────────────────
// 4. AUTO MOCK BUILDER
// ─────────────────────────────────────────────────────────────
/**
 * Builds a balanced mock question set.
 * Uses the existing selectQuestionsForSession from SmartQuestionSelector.
 */
export const buildSmartMock = async ({
  userId,
  examId,
  phaseId,
  subjectIds = [],
  topicIds   = [],
  difficulty = 'mixed',
  durationMinutes = 90,
  language = 'english',
  questionCount = null,
}) => {
  const { selectQuestionsForSession } = await import('./SmartQuestionSelector.js');

  const questions = await selectQuestionsForSession({
    userId,
    examId,
    phaseId,
    subjectIds,
    topicIds,
    difficultyPreference: difficulty,
    durationMinutes,
    language,
    mode: 'mock',
    questionCount,
  });

  const total   = questions.length;
  const target  = questionCount || Math.ceil(durationMinutes / 1.5);
  const shortage = total < target;

  return {
    questions,
    total,
    target,
    shortage,
    shortageMessage: shortage
      ? `Only ${total} questions available for your selection. Consider expanding subjects, topics, or difficulty.`
      : null,
  };
};

// ─────────────────────────────────────────────────────────────
// 5. RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────
export const generateRecommendations = async (userId, examId = null) => {
  const userOId   = toObjectId(userId);
  const examMatch = examId ? { examId: toObjectId(examId) } : {};

  // --- 5a. Weak topics (accuracy < 40%) ---
  const practiceSessions = await PracticeSession.find({
    userId: userOId,
    status: 'completed',
    ...examMatch,
  })
    .select('topicId subjectId totalCorrect totalQuestions')
    .limit(200)
    .lean();

  const topicStats = new Map();
  for (const s of practiceSessions) {
    const tid = s.topicId?.toString();
    if (!tid) continue;
    const prev = topicStats.get(tid) || { correct: 0, total: 0, topicId: s.topicId, subjectId: s.subjectId };
    prev.correct += (s.totalCorrect || 0);
    prev.total   += (s.totalQuestions || 0);
    topicStats.set(tid, prev);
  }

  const weakTopicIds = [];
  for (const [tid, st] of topicStats.entries()) {
    const acc = st.total > 0 ? (st.correct / st.total) * 100 : 0;
    if (acc < 40 && st.total >= 5) weakTopicIds.push(st);
  }

  const weakTopicDocs = await Topic.find({
    _id: { $in: weakTopicIds.map(t => t.topicId) },
  }).select('title').lean();
  const topicTitleMap = new Map(weakTopicDocs.map(t => [t._id.toString(), t.title]));

  const weakTopics = weakTopicIds
    .map(st => ({
      topicId:  st.topicId,
      subjectId: st.subjectId,
      title:    topicTitleMap.get(st.topicId?.toString()) || 'Unknown',
      accuracy: Math.round((st.correct / st.total) * 100),
      attempted: st.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 10);

  // --- 5b. High-weightage topics not mastered ---
  const weightages = await TopicWeightage.find({
    ...(examId ? { examId: toObjectId(examId) } : {}),
    weightagePercent: { $gte: 5 },
  })
    .populate('topicId', 'title')
    .sort({ weightagePercent: -1 })
    .limit(15)
    .lean();

  const highWeightageTopics = weightages.map(w => ({
    topicId:         w.topicId?._id,
    title:           w.topicId?.title || 'Unknown',
    weightagePercent: w.weightagePercent,
    examId:          w.examId,
  }));

  // --- 5c. Topics not attempted at all ---
  const attemptedTopicIds = [...topicStats.keys()].map(id => new mongoose.Types.ObjectId(id));
  const unseenTopics = await Topic.find({
    ...(examId ? { examId: toObjectId(examId) } : {}),
    _id: { $nin: attemptedTopicIds },
  })
    .select('title subjectId')
    .limit(10)
    .lean();

  // --- 5d. Unseen PYQs (questions not yet in UserQuestionHistory) ---
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const seenQIds = await UserQuestionHistory.find({
    userId: userOId,
    lastAttemptedAt: { $gt: thirtyDaysAgo },
  }).distinct('questionId');

  const unseenPYQTopics = await Question.aggregate([
    {
      $match: {
        isPreviousYearQuestion: true,
        isPublished: true,
        ...(examId ? { examId: toObjectId(examId) } : {}),
        _id: { $nin: seenQIds },
      },
    },
    { $group: { _id: '$topicId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    {
      $lookup: { from: 'topics', localField: '_id', foreignField: '_id', as: 'topic' },
    },
    { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
    { $project: { topicId: '$_id', topicName: { $ifNull: ['$topic.title', 'Unknown'] }, count: 1, _id: 0 } },
  ]);

  // --- 5e. Revision suggestions (overdue items) ---
  const today    = new Date();
  const overdue  = await RevisionItem.find({
    userId:   userOId,
    nextRevisionDate: { $lte: today },
    isCompleted: false,
  })
    .populate('questionId', 'questionText topicId')
    .sort({ nextRevisionDate: 1 })
    .limit(10)
    .lean();

  const revisionSuggestions = overdue.map(r => ({
    revisionId:   r._id,
    questionText: r.questionId?.questionText?.substring(0, 120) || '',
    topicId:      r.questionId?.topicId,
    dueDate:      r.nextRevisionDate,
  }));

  // --- 5f. Continue Learning (most recent practice session topic) ---
  const recentSession = await PracticeSession.findOne({
    userId: userOId,
    status: { $in: ['completed', 'in_progress'] },
  })
    .sort({ updatedAt: -1 })
    .populate('topicId', 'title')
    .lean();

  const continueLearning = recentSession
    ? {
        sessionId: recentSession._id,
        topicId:   recentSession.topicId?._id,
        topicName: recentSession.topicId?.title || 'Unknown',
        progress:  recentSession.totalQuestions > 0
          ? Math.round((recentSession.totalCorrect / recentSession.totalQuestions) * 100)
          : 0,
        lastActive: recentSession.updatedAt,
      }
    : null;

  return {
    weakTopics,
    highWeightageTopics,
    unseenTopics,
    unseenPYQTopics,
    revisionSuggestions,
    continueLearning,
  };
};

// ─────────────────────────────────────────────────────────────
// 6. ADMIN ANALYTICS
// ─────────────────────────────────────────────────────────────
export const computeAdminAnalytics = async (examId = null) => {
  const examMatch = examId ? { examId: toObjectId(examId) } : {};

  // Question growth — last 12 weeks
  const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000);
  const growthAgg = await Question.aggregate([
    { $match: { ...examMatch, createdAt: { $gte: twelveWeeksAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          week: { $isoWeek: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  // Difficulty distribution by subject
  const diffAgg = await Question.aggregate([
    { $match: { ...examMatch, isPublished: true } },
    {
      $group: {
        _id: { subjectId: '$subjectId', difficulty: '$difficulty' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: { from: 'subjects', localField: '_id.subjectId', foreignField: '_id', as: 'subject' },
    },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$_id.subjectId',
        subjectName: { $first: { $ifNull: ['$subject.title', 'Unknown'] } },
        easy:   { $sum: { $cond: [{ $eq: ['$_id.difficulty', 'easy'] },   '$count', 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$_id.difficulty', 'medium'] }, '$count', 0] } },
        hard:   { $sum: { $cond: [{ $eq: ['$_id.difficulty', 'hard'] },   '$count', 0] } },
      },
    },
    { $sort: { subjectName: 1 } },
  ]);

  // Import statistics
  const importStats = await QuestionImportBatch.aggregate([
    {
      $group: {
        _id: '$status',
        count:        { $sum: 1 },
        totalRows:    { $sum: '$totalRows' },
        importedRows: { $sum: '$importedRows' },
        failedRows:   { $sum: '$invalidRows' },
      },
    },
  ]);

  const importSummary = {
    totalBatches: importStats.reduce((s, r) => s + r.count, 0),
    totalRows:    importStats.reduce((s, r) => s + r.totalRows, 0),
    imported:     importStats.reduce((s, r) => s + r.importedRows, 0),
    failed:       importStats.reduce((s, r) => s + r.failedRows, 0),
    byStatus:     Object.fromEntries(importStats.map(r => [r._id, r.count])),
  };

  // Top 10 most solved questions (by PracticeSession answer count)
  // We approximate with UserQuestionHistory attemptCount
  const topSolved = await Question.aggregate([
    { $match: { ...examMatch, isPublished: true } },
    {
      $lookup: {
        from: 'userquestionhistories',
        localField: '_id',
        foreignField: 'questionId',
        as: 'history',
      },
    },
    { $addFields: { solveCount: { $size: '$history' } } },
    { $sort: { solveCount: -1 } },
    { $limit: 10 },
    {
      $project: {
        questionText: { $substr: ['$questionText', 0, 100] },
        solveCount: 1,
        difficulty: 1,
        topicId: 1,
      },
    },
  ]);

  // Bottom 10 least solved (published but never or rarely attempted)
  const leastSolved = await Question.aggregate([
    { $match: { ...examMatch, isPublished: true } },
    {
      $lookup: {
        from: 'userquestionhistories',
        localField: '_id',
        foreignField: 'questionId',
        as: 'history',
      },
    },
    { $addFields: { solveCount: { $size: '$history' } } },
    { $sort: { solveCount: 1 } },
    { $limit: 10 },
    {
      $project: {
        questionText: { $substr: ['$questionText', 0, 100] },
        solveCount: 1,
        difficulty: 1,
        topicId: 1,
      },
    },
  ]);

  // Accuracy by topic (from PracticeSession)
  const accuracyByTopic = await PracticeSession.aggregate([
    { $match: { status: 'completed', ...(examId ? { examId: toObjectId(examId) } : {}) } },
    {
      $group: {
        _id: '$topicId',
        totalCorrect:   { $sum: '$totalCorrect' },
        totalQuestions: { $sum: '$totalQuestions' },
        sessions:       { $sum: 1 },
      },
    },
    { $match: { totalQuestions: { $gt: 10 } } },
    {
      $addFields: {
        accuracy: { $multiply: [{ $divide: ['$totalCorrect', '$totalQuestions'] }, 100] },
      },
    },
    { $sort: { accuracy: -1 } },
    { $limit: 20 },
    {
      $lookup: { from: 'topics', localField: '_id', foreignField: '_id', as: 'topic' },
    },
    { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        topicName:      { $ifNull: ['$topic.title', 'Unknown'] },
        accuracy:       { $round: ['$accuracy', 1] },
        sessions:       1,
        totalQuestions: 1,
        _id: 0,
      },
    },
  ]);

  return {
    questionGrowth:      growthAgg,
    difficultyBySubject: diffAgg,
    importSummary,
    topSolvedQuestions:  topSolved,
    leastSolvedQuestions: leastSolved,
    accuracyByTopic,
  };
};
