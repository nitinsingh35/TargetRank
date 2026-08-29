import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';

// ─── HELPER: Build pagination meta ───────────────────────────────────────────
const paginate = (page, limit, total) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  pages: Math.ceil(total / limit),
});

// ─── 1. LIST EXAMS ────────────────────────────────────────────────────────────
// GET /api/admin/syllabus/list/exams
export const listExams = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20, category, status } = req.query;
    const query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (status === 'archived') query.isArchived = true;
    else if (status === 'published') { query.isPublished = true; query.isArchived = { $ne: true }; }
    else if (status === 'draft') { query.isPublished = false; }
    else { query.isArchived = { $ne: true }; }

    const skip = (Number(page) - 1) * Number(limit);
    const [exams, total] = await Promise.all([
      Exam.find(query).sort({ displayOrder: 1, title: 1 }).skip(skip).limit(Number(limit)).lean(),
      Exam.countDocuments(query),
    ]);
    res.status(200).json({ success: true, exams, pagination: paginate(page, limit, total) });
  } catch (err) { next(err); }
};

// ─── 2. LIST PHASES ──────────────────────────────────────────────────────────
// GET /api/admin/syllabus/list/phases
export const listPhases = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 30, examId, status } = req.query;
    const query = {};
    if (examId) query.examId = examId;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (status === 'archived') query.isArchived = true;
    else query.isArchived = { $ne: true };

    const skip = (Number(page) - 1) * Number(limit);
    const [phases, total] = await Promise.all([
      ExamPhase.find(query).populate('examId', 'title slug').sort({ examId: 1, order: 1 }).skip(skip).limit(Number(limit)).lean(),
      ExamPhase.countDocuments(query),
    ]);
    res.status(200).json({ success: true, phases, pagination: paginate(page, limit, total) });
  } catch (err) { next(err); }
};

// ─── 3. LIST SUBJECTS ────────────────────────────────────────────────────────
// GET /api/admin/syllabus/list/subjects
export const listSubjects = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 30, examId, phaseId, status } = req.query;
    const query = {};
    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (status === 'archived') query.isArchived = true;
    else query.isArchived = { $ne: true };

    const skip = (Number(page) - 1) * Number(limit);
    const [subjects, total] = await Promise.all([
      Subject.find(query).populate('examId', 'title').populate('phaseId', 'title').sort({ order: 1 }).skip(skip).limit(Number(limit)).lean(),
      Subject.countDocuments(query),
    ]);
    res.status(200).json({ success: true, subjects, pagination: paginate(page, limit, total) });
  } catch (err) { next(err); }
};

// ─── 4. LIST TOPICS ──────────────────────────────────────────────────────────
// GET /api/admin/syllabus/list/topics
export const listTopics = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 30, examId, phaseId, subjectId, status } = req.query;
    const query = {};
    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    if (subjectId) query.subjectId = subjectId;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (status === 'archived') query.isArchived = true;
    else query.isArchived = { $ne: true };

    const skip = (Number(page) - 1) * Number(limit);
    const [topics, total] = await Promise.all([
      Topic.find(query).populate('examId', 'title').populate('subjectId', 'title').sort({ order: 1 }).skip(skip).limit(Number(limit)).lean(),
      Topic.countDocuments(query),
    ]);
    res.status(200).json({ success: true, topics, pagination: paginate(page, limit, total) });
  } catch (err) { next(err); }
};

// ─── 5. LIST SUBTOPICS ───────────────────────────────────────────────────────
// GET /api/admin/syllabus/list/subtopics
export const listSubtopics = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 30, examId, topicId, subjectId, status } = req.query;
    const query = {};
    if (examId) query.examId = examId;
    if (topicId) query.topicId = topicId;
    if (subjectId) query.subjectId = subjectId;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (status === 'archived') query.isArchived = true;
    else query.isArchived = { $ne: true };

    const skip = (Number(page) - 1) * Number(limit);
    const [subtopics, total] = await Promise.all([
      Subtopic.find(query).populate('examId', 'title').populate('topicId', 'title').sort({ order: 1 }).skip(skip).limit(Number(limit)).lean(),
      Subtopic.countDocuments(query),
    ]);
    res.status(200).json({ success: true, subtopics, pagination: paginate(page, limit, total) });
  } catch (err) { next(err); }
};

// ─── 6. GET FULL SYLLABUS TREE (public-friendly) ─────────────────────────────
// GET /api/admin/syllabus/full-tree?examId=
export const getFullSyllabusTree = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const examFilter = examId ? { _id: examId } : {};

    const [exams, phases, subjects, topics, subtopics] = await Promise.all([
      Exam.find({ ...examFilter, isArchived: { $ne: true } }).sort({ displayOrder: 1, title: 1 }).lean(),
      ExamPhase.find({ isArchived: { $ne: true } }).sort({ order: 1 }).lean(),
      Subject.find({ isArchived: { $ne: true } }).sort({ order: 1 }).lean(),
      Topic.find({ isArchived: { $ne: true } }).sort({ order: 1 }).lean(),
      Subtopic.find({ isArchived: { $ne: true } }).sort({ order: 1 }).lean(),
    ]);

    // Build maps
    const subtopicMap = {};
    subtopics.forEach(st => {
      const key = st.topicId.toString();
      if (!subtopicMap[key]) subtopicMap[key] = [];
      subtopicMap[key].push(st);
    });

    const topicMap = {};
    topics.forEach(t => {
      const key = t.subjectId.toString();
      if (!topicMap[key]) topicMap[key] = [];
      topicMap[key].push({ ...t, subtopics: subtopicMap[t._id.toString()] || [] });
    });

    const subjectMap = {};
    subjects.forEach(sub => {
      const key = sub.phaseId ? sub.phaseId.toString() : null;
      if (!key) return;
      if (!subjectMap[key]) subjectMap[key] = [];
      subjectMap[key].push({ ...sub, topics: topicMap[sub._id.toString()] || [] });
    });

    const phaseMap = {};
    phases.forEach(ph => {
      const key = ph.examId.toString();
      if (!phaseMap[key]) phaseMap[key] = [];
      phaseMap[key].push({ ...ph, subjects: subjectMap[ph._id.toString()] || [] });
    });

    const tree = exams.map(ex => ({
      ...ex,
      phases: phaseMap[ex._id.toString()] || [],
    }));

    res.status(200).json({ success: true, tree });
  } catch (err) { next(err); }
};

// ─── 7. STATS SUMMARY ─────────────────────────────────────────────────────────
// GET /api/admin/syllabus/stats
export const getSyllabusStats = async (req, res, next) => {
  try {
    const [exams, phases, subjects, topics, subtopics] = await Promise.all([
      Exam.countDocuments({ isArchived: { $ne: true } }),
      ExamPhase.countDocuments({ isArchived: { $ne: true } }),
      Subject.countDocuments({ isArchived: { $ne: true } }),
      Topic.countDocuments({ isArchived: { $ne: true } }),
      Subtopic.countDocuments({ isArchived: { $ne: true } }),
    ]);
    res.status(200).json({ success: true, stats: { exams, phases, subjects, topics, subtopics } });
  } catch (err) { next(err); }
};
