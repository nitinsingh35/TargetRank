import mongoose from 'mongoose';
import RevisionItem    from '../models/RevisionItem.js';
import RevisionNote    from '../models/RevisionNote.js';
import Question        from '../models/Question.js';
import Bookmark        from '../models/Bookmark.js';
import PracticeSession from '../models/PracticeSession.js';
import MistakeNotebook from '../models/MistakeNotebook.js';
import { calculateNextRevision } from '../services/revisionSchedulerService.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Start-of-today in local midnight UTC */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** End-of-today */
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

/** Pagination helper */
const paginate = (req) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

/** Build a RevisionItem query from common filter params */
const buildItemFilter = (req, extra = {}) => {
  const { examId, phaseId, subjectId, topicId, sourceType, priority, status } = req.query;
  const filter = { userId: req.user._id, ...extra };
  if (examId)     filter.examId     = examId;
  if (phaseId)    filter.phaseId    = phaseId;
  if (subjectId)  filter.subjectId  = subjectId;
  if (topicId)    filter.topicId    = topicId;
  if (sourceType) filter.sourceType = sourceType;
  if (priority)   filter.priority   = priority;
  if (status)     filter.status     = status;
  return filter;
};

// ─── 1. GET /api/revision/dashboard ──────────────────────────────────────────

// @desc  Revision dashboard summary counts + weak topics
// @route GET /api/revision/dashboard
// @access Private
export const getRevisionDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today  = startOfToday();

    // Parallel count queries
    const [
      reviseTodayCount,
      overdueCount,
      totalPendingCount,
      masteredCount,
      bookmarkedCount,
      mistakeNotebookCount,
      recentActivity,
    ] = await Promise.all([
      // Due today (not yet overdue, and overdue items)
      RevisionItem.countDocuments({ userId, isArchived: false, status: 'pending', nextRevisionDate: { $lte: endOfToday() } }),
      // Strictly overdue (nextRevisionDate < today)
      RevisionItem.countDocuments({ userId, isArchived: false, status: 'pending', nextRevisionDate: { $lt: today } }),
      RevisionItem.countDocuments({ userId, isArchived: false, status: 'pending' }),
      RevisionItem.countDocuments({ userId, status: 'mastered' }),
      Bookmark.countDocuments({ userId }),
      RevisionItem.countDocuments({ userId, sourceType: { $in: ['wrong_answer', 'mock_test'] } }),
      // Recent 7-day activity
      RevisionItem.find({ userId, lastRevisedAt: { $gte: new Date(Date.now() - 7 * 86400000) } })
        .select('lastRevisedAt masteryScore status')
        .sort('-lastRevisedAt')
        .limit(20)
        .lean(),
    ]);

    // Revision streak: consecutive days with at least one revision
    const revisionStreak = await _calcRevisionStreak(userId);

    // Weak topics from submitted PracticeSession topicPerformance
    const { weakSubjects, weakTopics } = await _calcWeakAreasFromSessions(userId);

    res.status(200).json({
      success: true,
      reviseTodayCount,
      overdueCount,
      totalPendingCount,
      masteredCount,
      bookmarkedCount,
      mistakeNotebookCount,
      revisionStreak,
      weakSubjects,
      weakTopics,
      recentRevisionActivity: recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

// ─── helper: streak ──────────────────────────────────────────────────────────
async function _calcRevisionStreak(userId) {
  // Find all distinct revision dates (lastRevisedAt) sorted desc
  const items = await RevisionItem.find(
    { userId, lastRevisedAt: { $exists: true } },
    { lastRevisedAt: 1 }
  ).sort('-lastRevisedAt').lean();

  if (!items.length) return 0;

  const daySet = new Set(
    items.map(i => {
      const d = new Date(i.lastRevisedAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (daySet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── helper: weak areas ───────────────────────────────────────────────────────
async function _calcWeakAreasFromSessions(userId) {
  // Aggregate topicPerformance across all submitted sessions
  const sessions = await PracticeSession.find({ userId, status: 'submitted' })
    .select('topicPerformance subjectPerformance')
    .lean();

  // Merge topic stats
  const topicMap   = new Map();
  const subjectMap = new Map();

  for (const s of sessions) {
    for (const tp of (s.topicPerformance || [])) {
      const key = tp.topicId?.toString() || 'unknown';
      if (!topicMap.has(key)) {
        topicMap.set(key, {
          topicId: key,
          topicName: tp.topicName || 'Unknown Topic',
          total: 0, correct: 0, incorrect: 0, skipped: 0,
        });
      }
      const t = topicMap.get(key);
      t.total     += tp.total     || 0;
      t.correct   += tp.correct   || 0;
      t.incorrect += tp.incorrect || 0;
      t.skipped   += tp.skipped   || 0;
    }
    for (const sp of (s.subjectPerformance || [])) {
      const key = sp.subjectId?.toString() || 'unknown';
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subjectId: key,
          subjectName: sp.subjectName || 'Unknown Subject',
          total: 0, correct: 0, incorrect: 0,
        });
      }
      const sub = subjectMap.get(key);
      sub.total     += sp.total     || 0;
      sub.correct   += sp.correct   || 0;
      sub.incorrect += sp.incorrect || 0;
    }
  }

  // Filter weak topics: accuracy < 50%, attempted >= 2
  const weakTopics = Array.from(topicMap.values())
    .map(t => {
      const attempted = t.correct + t.incorrect;
      const accuracy  = attempted > 0 ? Math.round((t.correct / attempted) * 100) : 0;
      return { ...t, attempted, accuracy };
    })
    .filter(t => t.attempted >= 2 && t.accuracy < 50)
    .map(t => ({
      topicId:         t.topicId,
      topicName:       t.topicName,
      attempted:       t.attempted,
      incorrectCount:  t.incorrect,
      accuracy:        t.accuracy,
      suggestedAction: 'Practice more questions from this topic.',
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // Filter weak subjects: accuracy < 60%, attempted >= 3
  const weakSubjects = Array.from(subjectMap.values())
    .map(s => {
      const attempted = s.correct + s.incorrect;
      const accuracy  = attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0;
      return { ...s, attempted, accuracy };
    })
    .filter(s => s.attempted >= 3 && s.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy);

  return { weakSubjects, weakTopics };
}

// ─── 2. GET /api/revision/today ───────────────────────────────────────────────

// @desc  Return due-today and overdue RevisionItems (answers hidden)
// @route GET /api/revision/today
// @access Private
export const getRevisionToday = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req);
    const filter = buildItemFilter(req, {
      isArchived:       false,
      nextRevisionDate: { $lte: endOfToday() },
    });
    // Default to pending if no explicit status filter
    if (!req.query.status) filter.status = 'pending';

    const [items, total] = await Promise.all([
      RevisionItem.find(filter)
        .populate({
          path:   'questionId',
          select: 'questionText options marks negativeMarks questionType subjectId topicId difficulty language',
        })
        .populate('subjectId', 'title')
        .populate('topicId',   'title')
        .sort({ nextRevisionDate: 1, priority: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RevisionItem.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. GET /api/revision/mistake-notebook ────────────────────────────────────

// @desc  Return wrong_answer / mock_test RevisionItems (mistake notebook)
// @route GET /api/revision/mistake-notebook
// @access Private
export const getMistakeNotebookItems = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req);
    const filter = buildItemFilter(req, {
      sourceType: { $in: req.query.sourceType
        ? [req.query.sourceType]
        : ['wrong_answer', 'mock_test'],
      },
    });
    delete filter.sourceType; // re-set below
    if (req.query.sourceType) {
      filter.sourceType = req.query.sourceType;
    } else {
      filter.sourceType = { $in: ['wrong_answer', 'mock_test'] };
    }

    const [items, total] = await Promise.all([
      RevisionItem.find(filter)
        .populate({
          path:   'questionId',
          select: 'questionText options marks negativeMarks questionType subjectId topicId difficulty language',
        })
        .populate('subjectId', 'title')
        .populate('topicId',   'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RevisionItem.countDocuments(filter),
    ]);

    // Summary counts
    const [pendingCount, masteredCount] = await Promise.all([
      RevisionItem.countDocuments({ userId: req.user._id, sourceType: { $in: ['wrong_answer', 'mock_test'] }, status: 'pending' }),
      RevisionItem.countDocuments({ userId: req.user._id, sourceType: { $in: ['wrong_answer', 'mock_test'] }, status: 'mastered' }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: { pendingCount, masteredCount },
      items,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. GET /api/revision/bookmarks ──────────────────────────────────────────

// @desc  Return bookmarked questions with revision status
// @route GET /api/revision/bookmarks
// @access Private
export const getBookmarks = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req);
    const userId = req.user._id;

    const bmFilter = { userId };
    if (req.query.examId)   bmFilter.examId   = req.query.examId;
    if (req.query.phaseId)  bmFilter.phaseId  = req.query.phaseId;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find(bmFilter)
        .populate({
          path:   'questionId',
          select: 'questionText options marks negativeMarks questionType subjectId topicId difficulty language',
          populate: [
            { path: 'subjectId', select: 'title' },
            { path: 'topicId',   select: 'title' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bookmark.countDocuments(bmFilter),
    ]);

    // Enrich with RevisionItem existence flag
    const questionIds = bookmarks
      .map(b => b.questionId?._id)
      .filter(Boolean);

    const existingRevisionItems = await RevisionItem.find({
      userId,
      questionId: { $in: questionIds },
    }).select('questionId status masteryScore nextRevisionDate').lean();

    const revisionMap = new Map(
      existingRevisionItems.map(r => [r.questionId.toString(), r])
    );

    const enriched = bookmarks.map(b => {
      const qid = b.questionId?._id?.toString();
      return {
        ...b,
        revisionItem: qid ? (revisionMap.get(qid) || null) : null,
      };
    });

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      items: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 5. POST /api/revision/items/:id/start ───────────────────────────────────

// @desc  Start a revision item – returns question WITHOUT correct answer
// @route POST /api/revision/items/:id/start
// @access Private
export const startRevisionItem = async (req, res, next) => {
  try {
    const item = await RevisionItem.findById(req.params.id)
      .populate({
        path:   'questionId',
        select: 'questionText options marks negativeMarks questionType subjectId topicId difficulty language',
        populate: [
          { path: 'subjectId', select: 'title' },
          { path: 'topicId',   select: 'title' },
        ],
      })
      .lean();

    if (!item) return res.status(404).json({ message: 'Revision item not found.' });
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this revision item.' });
    }

    const q = item.questionId;

    res.status(200).json({
      success: true,
      item: {
        _id:            item._id,
        revisionCount:  item.revisionCount,
        masteryScore:   item.masteryScore,
        priority:       item.priority,
        status:         item.status,
        sourceType:     item.sourceType,
        confidenceLevel: item.confidenceLevel,
        note:           item.note || '',
        lastAnswerStatus: item.lastAnswerStatus,
        nextRevisionDate: item.nextRevisionDate,
      },
      question: {
        _id:           q?._id,
        questionText:  q?.questionText,
        options:       q?.options,
        marks:         q?.marks,
        negativeMarks: q?.negativeMarks,
        questionType:  q?.questionType,
        difficulty:    q?.difficulty,
        language:      q?.language,
        subject:       q?.subjectId?.title || '',
        topic:         q?.topicId?.title   || '',
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6. POST /api/revision/items/:id/answer ──────────────────────────────────

// @desc  Check the user's selected answer (reveals correct answer + explanation)
// @route POST /api/revision/items/:id/answer
// @access Private
export const checkRevisionAnswer = async (req, res, next) => {
  try {
    const { selectedAnswer, confidenceLevel } = req.body;

    const item = await RevisionItem.findById(req.params.id)
      .populate({
        path:   'questionId',
        select: 'questionText options correctAnswer explanation marks negativeMarks',
      });

    if (!item) return res.status(404).json({ message: 'Revision item not found.' });
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this revision item.' });
    }

    const q           = item.questionId;
    const correctAns  = q?.correctAnswer?.trim() || '';
    const userAns     = (selectedAnswer || '').trim();
    const isCorrect   = userAns !== '' && userAns === correctAns;

    // Determine suggested next action (guidance only – not saved yet)
    let suggestedAction;
    if (!userAns) {
      suggestedAction = 'skipped';
    } else if (isCorrect) {
      suggestedAction = item.revisionCount >= 4 ? 'mastered' : 'revised';
    } else {
      suggestedAction = 'incorrect_again';
    }

    res.status(200).json({
      success: true,
      selectedAnswer:  userAns || null,
      correctAnswer:   correctAns,
      explanation:     q?.explanation || '',
      isCorrect,
      suggestedAction,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 7. POST /api/revision/items/:id/complete ────────────────────────────────

// @desc  Complete a revision attempt and advance the spaced-repetition schedule
// @route POST /api/revision/items/:id/complete
// @access Private
export const completeRevisionItem = async (req, res, next) => {
  try {
    const { action, selectedAnswer, confidenceLevel, note } = req.body;

    const VALID_ACTIONS = ['revised', 'mastered', 'skipped', 'incorrect_again'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ message: `action must be one of: ${VALID_ACTIONS.join(', ')}` });
    }

    const item = await RevisionItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Revision item not found.' });
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this revision item.' });
    }

    // Double-click / duplicate prevention:
    // If lastRevisedAt is within the last 5 seconds, skip update.
    if (item.lastRevisedAt) {
      const msSinceLast = Date.now() - new Date(item.lastRevisedAt).getTime();
      if (msSinceLast < 5000) {
        return res.status(200).json({
          success: true,
          message: 'Already processed (duplicate request ignored).',
          item,
        });
      }
    }

    // Determine isCorrect
    const q = await Question.findById(item.questionId).select('correctAnswer').lean();
    const correctAns = q?.correctAnswer?.trim() || '';
    const userAns    = (selectedAnswer || '').trim();
    const isCorrect  = userAns !== '' && userAns === correctAns;

    // Calculate next schedule
    const schedule = calculateNextRevision(
      action,
      item.revisionCount,
      confidenceLevel || item.confidenceLevel || 'medium',
      item.masteryScore
    );

    const now = new Date();

    // Update revision history entry
    const historyEntry = {
      revisedAt:       now,
      action,
      selectedAnswer:  userAns || null,
      isCorrect,
      nextRevisionDate: schedule.nextRevisionDate,
      note:            note || '',
    };

    // Determine lastAnswerStatus
    let lastAnswerStatus = 'unknown';
    if (!userAns)        lastAnswerStatus = 'skipped';
    else if (isCorrect)  lastAnswerStatus = 'correct';
    else                 lastAnswerStatus = 'incorrect';

    // Apply all updates
    item.revisionCount    += 1;
    item.lastRevisedAt    = now;
    item.lastPracticedAt  = now;
    item.nextRevisionDate = schedule.nextRevisionDate;
    item.priority         = schedule.priority;
    item.status           = schedule.status;
    item.masteryScore     = schedule.masteryScore;
    item.lastAnswerStatus = lastAnswerStatus;

    if (confidenceLevel) item.confidenceLevel = confidenceLevel;
    if (note !== undefined && note !== '') item.note = note;

    item.revisionHistory.push(historyEntry);

    await item.save();

    // Upsert RevisionNote if note provided
    if (note && note.trim() !== '') {
      await RevisionNote.findOneAndUpdate(
        { userId: item.userId, questionId: item.questionId },
        {
          userId:         item.userId,
          questionId:     item.questionId,
          revisionItemId: item._id,
          noteText:       note.trim(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Revision completed.',
      item,
      nextRevisionDate: schedule.nextRevisionDate,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 8. POST /api/revision/items/:id/note ────────────────────────────────────

// @desc  Save or update a personal note for a revision item
// @route POST /api/revision/items/:id/note
// @access Private
export const saveRevisionNote = async (req, res, next) => {
  try {
    const { noteText } = req.body;
    if (noteText === undefined) {
      return res.status(400).json({ message: 'noteText is required.' });
    }

    const item = await RevisionItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Revision item not found.' });
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }

    const savedNote = await RevisionNote.findOneAndUpdate(
      { userId: item.userId, questionId: item.questionId },
      {
        userId:         item.userId,
        questionId:     item.questionId,
        revisionItemId: item._id,
        noteText:       (noteText || '').trim(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mirror the inline note on RevisionItem
    item.note = (noteText || '').trim();
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Note saved.',
      note: savedNote,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 9. POST /api/revision/items/:id/archive ─────────────────────────────────

// @desc  Soft-archive a revision item (hides it from daily deck)
// @route POST /api/revision/items/:id/archive
// @access Private
export const archiveRevisionItem = async (req, res, next) => {
  try {
    const item = await RevisionItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Revision item not found.' });
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }

    item.isArchived = true;
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Revision item archived.',
      itemId: item._id,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 10. POST /api/revision/from-bookmark/:questionId ────────────────────────

// @desc  Create a RevisionItem from a bookmark (idempotent – no-op if exists)
// @route POST /api/revision/from-bookmark/:questionId
// @access Private
export const createRevisionFromBookmark = async (req, res, next) => {
  try {
    const userId     = req.user._id;
    const questionId = req.params.questionId;

    // Validate question exists
    const question = await Question.findById(questionId)
      .select('examId phaseId subjectId topicId')
      .lean();
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    // Check ownership of bookmark (optional guard – prevents arbitrary questionId injection)
    const bookmark = await Bookmark.findOne({ userId, questionId }).lean();
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found for this question.' });
    }

    // Idempotent: return existing RevisionItem if already present
    const existing = await RevisionItem.findOne({ userId, questionId }).lean();
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Revision item already exists.',
        created: false,
        item: existing,
      });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const newItem = await RevisionItem.create({
      userId,
      questionId,
      examId:    question.examId,
      phaseId:   question.phaseId,
      subjectId: question.subjectId,
      topicId:   question.topicId,
      sourceType:       'bookmarked',
      priority:         'medium',
      status:           'pending',
      nextRevisionDate: startOfToday(), // Available today
    });

    res.status(201).json({
      success: true,
      message: 'Revision item created from bookmark.',
      created: true,
      item: newItem,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 11. GET /api/revision/weak-topics ───────────────────────────────────────

// @desc  Return aggregated weak subjects and topics from PracticeSession data
// @route GET /api/revision/weak-topics
// @access Private
export const getWeakTopics = async (req, res, next) => {
  try {
    const { weakSubjects, weakTopics } = await _calcWeakAreasFromSessions(req.user._id);
    res.status(200).json({
      success: true,
      weakSubjects,
      weakTopics,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 12. POST /api/revision/weak-topics/start ────────────────────────────────

// @desc  Create a PracticeSession targeting specific weak topic IDs
// @route POST /api/revision/weak-topics/start
// @access Private
export const startWeakTopicSession = async (req, res, next) => {
  try {
    const { topicIds, questionCount = 20 } = req.body;

    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({ message: 'topicIds array is required.' });
    }

    const userId = req.user._id;

    // We need examId and phaseId – derive from the user's most recent session or from query params
    const examId  = req.body.examId  || req.query.examId;
    const phaseId = req.body.phaseId || req.query.phaseId;
    if (!examId || !phaseId) {
      return res.status(400).json({ message: 'examId and phaseId are required to create a practice session.' });
    }

    // Expiry is set far in the future for revision sessions (user-controlled timing)
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 1);

    const session = await PracticeSession.create({
      userId,
      examId,
      phaseId,
      mode:                   'revision',
      durationMinutes:        0,   // No enforced time limit for revision sessions
      requestedQuestionCount: Math.max(1, Math.min(100, Number(questionCount))),
      generatedQuestionCount: 0,
      topicIds,
      status:                 'created',
      expiresAt:              farFuture,
    });

    res.status(201).json({
      success: true,
      message: 'Weak-topic practice session created.',
      sessionId:    session._id,
      redirectPath: `/aspirant/practice-session/${session._id}`,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Legacy stubs kept for backward-compatibility ────────────────────────────

// @desc    Get pending revision items (legacy Phase 6 route)
// @route   GET /api/revision/items
export const getRevisionItems = async (req, res, next) => {
  try {
    const items = await RevisionItem.find({
      userId:           req.user._id,
      status:           'pending',
      nextRevisionDate: { $lte: new Date() },
      isArchived:       false,
    })
      .populate({ path: 'questionId', select: 'questionText options marks negativeMarks questionType subjectId topicId difficulty language' })
      .populate('subjectId', 'title')
      .populate('topicId',   'title')
      .sort('nextRevisionDate')
      .lean();

    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Update revision status (legacy Phase 6 route)
// @route   PUT /api/revision/items/:id
export const updateRevisionStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const item = await RevisionItem.findById(req.params.id);

    if (!item) return res.status(404).json({ message: 'Revision item not found.' });
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }

    item.status       = status;
    item.lastRevisedAt = new Date();
    if (notes !== undefined) item.notes = notes;

    if (status === 'revised') {
      item.revisionCount += 1;
      let intervalDays = 3;
      if (item.revisionCount === 2) intervalDays = 7;
      if (item.revisionCount === 3) intervalDays = 15;
      if (item.revisionCount === 4) intervalDays = 30;
      if (item.revisionCount >= 5) {
        item.status = 'mastered';
      } else {
        item.status          = 'pending';
        item.nextRevisionDate = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
      }
    }

    await item.save();
    res.status(200).json({ message: 'Spaced repetition schedule updated.', item });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mistake notebook (legacy)
// @route   GET /api/revision/mistakes
export const getMistakeNotebook = async (req, res, next) => {
  try {
    const { resolved = 'false' } = req.query;
    const filter = { userId: req.user._id, resolved: resolved === 'true' };
    const mistakes = await MistakeNotebook.find(filter)
      .populate({ path: 'questionId', populate: { path: 'examId subjectId topicId', select: 'title' } })
      .sort('-createdAt');
    res.status(200).json(mistakes);
  } catch (error) {
    next(error);
  }
};

// @desc    Update mistake note (legacy)
// @route   PUT /api/revision/mistakes/:id
export const updateMistakeNote = async (req, res, next) => {
  try {
    const { mistakeReason, personalNote, resolved } = req.body;
    const mistake = await MistakeNotebook.findById(req.params.id);
    if (!mistake) return res.status(404).json({ message: 'Mistake record not found.' });
    if (mistake.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
    if (mistakeReason !== undefined) mistake.mistakeReason = mistakeReason;
    if (personalNote  !== undefined) mistake.personalNote  = personalNote;
    if (resolved      !== undefined) mistake.resolved      = resolved;
    await mistake.save();
    res.status(200).json({ message: 'Mistake notebook updated.', mistake });
  } catch (error) {
    next(error);
  }
};
