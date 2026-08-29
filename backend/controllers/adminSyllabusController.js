import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';
import Question from '../models/Question.js';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// ─── 1. GET /api/admin/syllabus/tree ──────────────────────────────────────────
// @desc  Get nested syllabus tree hierarchy (Exams -> Phases -> Subjects -> Topics -> Subtopics)
// @route GET /api/admin/syllabus/tree
// @access Private/Admin
export const getSyllabusTree = async (req, res, next) => {
  try {
    const [exams, phases, subjects, topics, subtopics] = await Promise.all([
      Exam.find({}).lean(),
      ExamPhase.find({}).sort('order').lean(),
      Subject.find({}).sort('order').lean(),
      Topic.find({}).sort('recommendedStudyOrder').lean(),
      Subtopic.find({}).sort('recommendedStudyOrder').lean(),
    ]);

    // Build the hierarchy tree map
    const subtopicMap = {};
    subtopics.forEach(st => {
      const tId = st.topicId.toString();
      if (!subtopicMap[tId]) subtopicMap[tId] = [];
      subtopicMap[tId].push(st);
    });

    const topicMap = {};
    topics.forEach(t => {
      const sId = t.subjectId.toString();
      if (!topicMap[sId]) topicMap[sId] = [];
      topicMap[sId].push({
        ...t,
        subtopics: subtopicMap[t._id.toString()] || [],
      });
    });

    const subjectMap = {};
    subjects.forEach(sub => {
      const pId = sub.phaseId.toString();
      if (!subjectMap[pId]) subjectMap[pId] = [];
      subjectMap[pId].push({
        ...sub,
        topics: topicMap[sub._id.toString()] || [],
      });
    });

    const phaseMap = {};
    phases.forEach(ph => {
      const eId = ph.examId.toString();
      if (!phaseMap[eId]) phaseMap[eId] = [];
      phaseMap[eId].push({
        ...ph,
        subjects: subjectMap[ph._id.toString()] || [],
      });
    });

    const tree = exams.map(ex => ({
      ...ex,
      phases: phaseMap[ex._id.toString()] || [],
    }));

    res.status(200).json({
      success: true,
      tree,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. POST /api/admin/syllabus/import ───────────────────────────────────────
// @desc  Import/Update syllabus exams structures idempotently
// @route POST /api/admin/syllabus/import
// @access Private/Admin
export const importSyllabus = async (req, res, next) => {
  try {
    const { exams } = req.body;
    if (!exams || !Array.isArray(exams)) {
      return res.status(400).json({ message: 'Request body must contain exams array.' });
    }

    const createdBy = req.user._id;

    let examsSeeded = 0;
    let phasesSeeded = 0;
    let subjectsSeeded = 0;
    let topicsSeeded = 0;
    let subtopicsSeeded = 0;

    for (const examData of exams) {
      const examSlug = slugify(examData.title);

      const exam = await Exam.findOneAndUpdate(
        { slug: examSlug },
        {
          title: examData.title,
          shortDescription: examData.shortDescription || examData.title,
          fullDescription: examData.fullDescription || '',
          conductingBody: examData.conductingBody || '',
          eligibility: examData.eligibility || '',
          examPattern: examData.examPattern || '',
          createdBy,
          active: true,
        },
        { upsert: true, new: true, runValidators: true }
      );
      examsSeeded++;

      if (examData.phases && Array.isArray(examData.phases)) {
        for (const phaseData of examData.phases) {
          const phaseSlug = slugify(phaseData.title);

          const phase = await ExamPhase.findOneAndUpdate(
            { examId: exam._id, slug: phaseSlug },
            {
              title: phaseData.title,
              description: phaseData.description || '',
              order: phaseData.order || 0,
              active: true,
            },
            { upsert: true, new: true, runValidators: true }
          );
          phasesSeeded++;

          if (phaseData.subjects && Array.isArray(phaseData.subjects)) {
            for (const subjectData of phaseData.subjects) {
              const subjectSlug = slugify(subjectData.title);

              const subject = await Subject.findOneAndUpdate(
                { phaseId: phase._id, slug: subjectSlug },
                {
                  examId: exam._id,
                  title: subjectData.title,
                  description: subjectData.description || '',
                  order: subjectData.order || 0,
                  active: true,
                },
                { upsert: true, new: true, runValidators: true }
              );
              subjectsSeeded++;

              if (subjectData.topics && Array.isArray(subjectData.topics)) {
                for (const topicData of subjectData.topics) {
                  const topicSlug = slugify(topicData.title);

                  const topic = await Topic.findOneAndUpdate(
                    { subjectId: subject._id, slug: topicSlug },
                    {
                      examId: exam._id,
                      phaseId: phase._id,
                      title: topicData.title,
                      description: topicData.description || '',
                      recommendedStudyOrder: topicData.recommendedStudyOrder || 0,
                      estimatedWeightage: topicData.estimatedWeightage || 'medium',
                      questionTarget: topicData.questionTarget || 100,
                      pyqTarget: topicData.pyqTarget || 10,
                      languageSupport: topicData.languageSupport || 'bilingual',
                      order: topicData.recommendedStudyOrder || 0,
                      active: true,
                    },
                    { upsert: true, new: true, runValidators: true }
                  );
                  topicsSeeded++;

                  if (topicData.subtopics && Array.isArray(topicData.subtopics)) {
                    for (const subtopicData of topicData.subtopics) {
                      const subtopicSlug = slugify(subtopicData.title);

                      await Subtopic.findOneAndUpdate(
                        { topicId: topic._id, slug: subtopicSlug },
                        {
                          examId: exam._id,
                          phaseId: phase._id,
                          subjectId: subject._id,
                          title: subtopicData.title,
                          description: subtopicData.description || '',
                          estimatedWeightage: subtopicData.estimatedWeightage || 'medium',
                          recommendedStudyOrder: subtopicData.recommendedStudyOrder || 0,
                          questionTarget: subtopicData.questionTarget || 30,
                          pyqTarget: subtopicData.pyqTarget || 3,
                          languageSupport: 'bilingual',
                          active: true,
                        },
                        { upsert: true, new: true, runValidators: true }
                      );
                      subtopicsSeeded++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Syllabus imported successfully.',
      imported: {
        exams: examsSeeded,
        phases: phasesSeeded,
        subjects: subjectsSeeded,
        topics: topicsSeeded,
        subtopics: subtopicsSeeded,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. PUT /api/admin/topics/:id ────────────────────────────────────────────
// @desc  Update specific topic settings
// @route PUT /api/admin/topics/:id
// @access Private/Admin
export const updateTopicSettings = async (req, res, next) => {
  try {
    const {
      description,
      recommendedStudyOrder,
      estimatedWeightage,
      questionTarget,
      pyqTarget,
      languageSupport,
      active,
    } = req.body;

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }

    if (description !== undefined)           topic.description = description;
    if (recommendedStudyOrder !== undefined) {
      topic.recommendedStudyOrder = Number(recommendedStudyOrder);
      topic.order = Number(recommendedStudyOrder);
    }
    if (estimatedWeightage !== undefined)     topic.estimatedWeightage = estimatedWeightage;
    if (questionTarget !== undefined)         topic.questionTarget = Number(questionTarget);
    if (pyqTarget !== undefined)              topic.pyqTarget = Number(pyqTarget);
    if (languageSupport !== undefined)        topic.languageSupport = languageSupport;
    if (active !== undefined)                 topic.active = !!active;

    await topic.save();

    res.status(200).json({
      success: true,
      message: 'Topic parameters updated successfully.',
      topic,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. GET /api/admin/syllabus/coverage ──────────────────────────────────────
// @desc  Calculate syllabus coverage metrics mapped to question counts
// @route GET /api/admin/syllabus/coverage
// @access Private/Admin
export const getSyllabusCoverage = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const filter = {};
    if (examId) filter._id = examId;

    // Load syllabus elements
    const [exams, phases, subjects, topics, subtopics] = await Promise.all([
      Exam.find(filter).lean(),
      ExamPhase.find({}).sort('order').lean(),
      Subject.find({}).sort('order').lean(),
      Topic.find({}).sort('recommendedStudyOrder').lean(),
      Subtopic.find({}).sort('recommendedStudyOrder').lean(),
    ]);

    // Aggregate questions count by topic and subtopic
    const aggregatedCounts = await Question.aggregate([
      {
        $group: {
          _id: {
            topicId: '$topicId',
            subtopic: '$subtopic',
          },
          total: { $sum: 1 },
          pyqs: {
            $sum: {
              $cond: [{ $eq: ['$sourceType', 'verified_previous_year'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Build indexing lookups for counts
    const topicTotalCounts = {};
    const topicPyqCounts = {};
    const subtopicTotalCounts = {};
    const subtopicPyqCounts = {};

    aggregatedCounts.forEach(item => {
      const tId = item._id.topicId ? item._id.topicId.toString() : 'null';
      const subKey = item._id.subtopic ? item._id.subtopic.trim().toLowerCase() : '';

      // Topic total aggregation
      topicTotalCounts[tId] = (topicTotalCounts[tId] || 0) + item.total;
      topicPyqCounts[tId] = (topicPyqCounts[tId] || 0) + item.pyqs;

      // Subtopic key lookup
      if (subKey) {
        const fullKey = `${tId}_${subKey}`;
        subtopicTotalCounts[fullKey] = item.total;
        subtopicPyqCounts[fullKey] = item.pyqs;
      }
    });

    // Map subtopic list
    const subtopicTree = subtopics.map(st => {
      const tId = st.topicId.toString();
      const subKey = st.title.trim().toLowerCase();
      const slugKey = st.slug.trim().toLowerCase();

      // Check counts via both title or slug keys
      const currentCount = subtopicTotalCounts[`${tId}_${subKey}`] || subtopicTotalCounts[`${tId}_${slugKey}`] || 0;
      const currentPyqs = subtopicPyqCounts[`${tId}_${subKey}`] || subtopicPyqCounts[`${tId}_${slugKey}`] || 0;
      
      const targetCount = st.questionTarget || 30;
      const coveragePercentage = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 0;

      return {
        _id: st._id,
        topicId: st.topicId,
        title: st.title,
        currentCount,
        currentPyqCount: currentPyqs,
        targetCount,
        coveragePercentage,
        missingWarning: currentCount === 0,
      };
    });

    const subtopicMap = {};
    subtopicTree.forEach(st => {
      const tId = st.topicId.toString();
      if (!subtopicMap[tId]) subtopicMap[tId] = [];
      subtopicMap[tId].push(st);
    });

    // Map topics list
    const topicTree = topics.map(t => {
      const tId = t._id.toString();
      const currentCount = topicTotalCounts[tId] || 0;
      const currentPyqCount = topicPyqCounts[tId] || 0;
      const targetCount = t.questionTarget || 100;
      const coveragePercentage = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 0;

      return {
        _id: t._id,
        subjectId: t.subjectId,
        title: t.title,
        estimatedWeightage: t.estimatedWeightage,
        currentCount,
        currentPyqCount,
        targetCount,
        coveragePercentage,
        missingWarning: currentCount === 0,
        subtopics: subtopicMap[tId] || [],
      };
    });

    const topicMap = {};
    topicTree.forEach(t => {
      const sId = t.subjectId.toString();
      if (!topicMap[sId]) topicMap[sId] = [];
      topicMap[sId].push(t);
    });

    // Map subjects list
    const subjectTree = subjects.map(sub => {
      const childTopics = topicMap[sub._id.toString()] || [];
      const currentCount = childTopics.reduce((acc, t) => acc + t.currentCount, 0);
      const currentPyqCount = childTopics.reduce((acc, t) => acc + t.currentPyqCount, 0);
      const targetCount = childTopics.reduce((acc, t) => acc + t.targetCount, 0);
      const coveragePercentage = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 0;

      return {
        _id: sub._id,
        phaseId: sub.phaseId,
        title: sub.title,
        currentCount,
        currentPyqCount,
        targetCount,
        coveragePercentage,
        missingWarning: currentCount === 0,
        topics: childTopics,
      };
    });

    const subjectMap = {};
    subjectTree.forEach(sub => {
      const pId = sub.phaseId.toString();
      if (!subjectMap[pId]) subjectMap[pId] = [];
      subjectMap[pId].push(sub);
    });

    // Map phases list
    const phaseTree = phases.map(ph => {
      const childSubjects = subjectMap[ph._id.toString()] || [];
      const currentCount = childSubjects.reduce((acc, s) => acc + s.currentCount, 0);
      const currentPyqCount = childSubjects.reduce((acc, s) => acc + s.currentPyqCount, 0);
      const targetCount = childSubjects.reduce((acc, s) => acc + s.targetCount, 0);
      const coveragePercentage = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 0;

      return {
        _id: ph._id,
        examId: ph.examId,
        title: ph.title,
        currentCount,
        currentPyqCount,
        targetCount,
        coveragePercentage,
        missingWarning: currentCount === 0,
        subjects: childSubjects,
      };
    });

    const phaseMap = {};
    phaseTree.forEach(ph => {
      const eId = ph.examId.toString();
      if (!phaseMap[eId]) phaseMap[eId] = [];
      phaseMap[eId].push(ph);
    });

    // Map exams list
    const coverage = exams.map(ex => {
      const childPhases = phaseMap[ex._id.toString()] || [];
      const currentCount = childPhases.reduce((acc, p) => acc + p.currentCount, 0);
      const currentPyqCount = childPhases.reduce((acc, p) => acc + p.currentPyqCount, 0);
      const targetCount = childPhases.reduce((acc, p) => acc + p.targetCount, 0);
      const coveragePercentage = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 0;

      return {
        _id: ex._id,
        title: ex.title,
        currentCount,
        currentPyqCount,
        targetCount,
        coveragePercentage,
        missingWarning: currentCount === 0,
        phases: childPhases,
      };
    });

    res.status(200).json({
      success: true,
      coverage,
    });
  } catch (err) {
    next(err);
  }
};
