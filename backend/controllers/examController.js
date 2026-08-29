import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';

// Helper: Make slug from title
const makeSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ─── EXAMS ───

// @desc    Get active exams
// @route   GET /api/exams
// @access  Public
export const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ active: true }).sort('title');
    res.status(200).json(exams);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all exams (including inactive)
// @route   GET /api/exams/admin/all
// @access  Private/Admin
export const getAllExamsAdmin = async (req, res, next) => {
  try {
    const exams = await Exam.find({}).sort('title');
    res.status(200).json(exams);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single exam by slug
// @route   GET /api/exams/:slug
// @access  Public
export const getExamBySlug = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ slug: req.params.slug });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(200).json(exam);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private/Admin
export const createExam = async (req, res, next) => {
  try {
    const { title, shortDescription, fullDescription, conductingBody, eligibility, examPattern, importantDates, image, active } = req.body;

    const slug = makeSlug(title);
    const existing = await Exam.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'An exam with a similar title already exists.' });
    }

    const exam = await Exam.create({
      title,
      slug,
      shortDescription,
      fullDescription,
      conductingBody,
      eligibility,
      examPattern,
      importantDates: importantDates || [],
      image: image || '',
      active: active !== undefined ? active : true,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Exam created successfully', exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
export const updateExam = async (req, res, next) => {
  try {
    const { title, shortDescription, fullDescription, conductingBody, eligibility, examPattern, importantDates, image, active } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (title && title !== exam.title) {
      exam.title = title;
      exam.slug = makeSlug(title);
    }
    if (shortDescription !== undefined) exam.shortDescription = shortDescription;
    if (fullDescription !== undefined) exam.fullDescription = fullDescription;
    if (conductingBody !== undefined) exam.conductingBody = conductingBody;
    if (eligibility !== undefined) exam.eligibility = eligibility;
    if (examPattern !== undefined) exam.examPattern = examPattern;
    if (importantDates !== undefined) exam.importantDates = importantDates;
    if (image !== undefined) exam.image = image;
    if (active !== undefined) exam.active = active;

    const updatedExam = await exam.save();
    res.status(200).json({ message: 'Exam updated successfully', exam: updatedExam });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
export const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Cascade delete phases, subjects, and topics associated with this exam
    await ExamPhase.deleteMany({ examId: exam._id });
    await Subject.deleteMany({ examId: exam._id });
    await Topic.deleteMany({ examId: exam._id });
    await exam.deleteOne();

    res.status(200).json({ message: 'Exam and all associated syllabus components deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── NESTED SYLLABUS ───

// @desc    Get full nested syllabus of an exam (Exam -> Phases -> Subjects -> Topics)
// @route   GET /api/exams/:id/syllabus
// @access  Public
export const getExamSyllabus = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const phases   = await ExamPhase.find({ examId: exam._id }).sort('order').lean();
    const subjects = await Subject.find({ examId: exam._id }).sort('order').lean();
    const topics   = await Topic.find({ examId: exam._id }).sort('order').lean();
    const subtopics = await Subtopic.find({ examId: exam._id }).sort('order').lean();

    // Build subtopic map keyed by topicId
    const subtopicMap = {};
    subtopics.forEach(st => {
      const key = st.topicId.toString();
      if (!subtopicMap[key]) subtopicMap[key] = [];
      subtopicMap[key].push(st);
    });

    let syllabusTree;

    if (phases.length > 0) {
      // Build tree from actual phases
      syllabusTree = phases.map((phase) => {
        const phaseSubjects = subjects
          .filter((sub) => sub.phaseId && sub.phaseId.toString() === phase._id.toString())
          .map((subject) => {
            const subjectTopics = topics
              .filter((top) => top.subjectId.toString() === subject._id.toString())
              .map((topic) => ({
                ...topic,
                subtopics: subtopicMap[topic._id.toString()] || [],
              }));
            return {
              ...subject,
              topics: subjectTopics,
            };
          });

        return {
          ...phase,
          subjects: phaseSubjects,
        };
      });
    } else {
      // Fallback: no phases — group subjects directly under a virtual "All Topics" phase
      const allSubjects = subjects.map((subject) => {
        const subjectTopics = topics
          .filter((top) => top.subjectId.toString() === subject._id.toString())
          .map((topic) => ({
            ...topic,
            subtopics: subtopicMap[topic._id.toString()] || [],
          }));
        return {
          ...subject,
          topics: subjectTopics,
        };
      });

      syllabusTree = [{
        _id: exam._id.toString() + '_default',
        title: 'All Topics',
        slug: 'all-topics',
        description: 'All topics for this exam',
        examId: exam._id,
        subjects: allSubjects,
      }];
    }

    res.status(200).json({
      exam,
      syllabus: syllabusTree,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PHASES ───

// @desc    Create exam phase
// @route   POST /api/exams/:examId/phases
// @access  Private/Admin
export const createPhase = async (req, res, next) => {
  try {
    const { title, description, order, active } = req.body;
    const phase = await ExamPhase.create({
      examId: req.params.examId,
      title,
      description,
      order: order || 0,
      active: active !== undefined ? active : true,
    });
    res.status(201).json({ message: 'Phase created successfully', phase });
  } catch (error) {
    next(error);
  }
};

// @desc    Update exam phase
// @route   PUT /api/exams/phases/:id
// @access  Private/Admin
export const updatePhase = async (req, res, next) => {
  try {
    const { title, description, order, active } = req.body;
    const phase = await ExamPhase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({ message: 'Phase not found' });
    }

    if (title !== undefined) phase.title = title;
    if (description !== undefined) phase.description = description;
    if (order !== undefined) phase.order = order;
    if (active !== undefined) phase.active = active;

    const updatedPhase = await phase.save();
    res.status(200).json({ message: 'Phase updated successfully', phase: updatedPhase });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete exam phase
// @route   DELETE /api/exams/phases/:id
// @access  Private/Admin
export const deletePhase = async (req, res, next) => {
  try {
    const phase = await ExamPhase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({ message: 'Phase not found' });
    }

    // Cascade delete subjects and topics
    await Subject.deleteMany({ phaseId: phase._id });
    await Topic.deleteMany({ phaseId: phase._id });
    await phase.deleteOne();

    res.status(200).json({ message: 'Phase and associated subjects/topics deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── SUBJECTS ───

// @desc    Create subject
// @route   POST /api/exams/:examId/subjects
// @access  Private/Admin
export const createSubject = async (req, res, next) => {
  try {
    const { phaseId, title, description, order, active } = req.body;
    const subject = await Subject.create({
      examId: req.params.examId,
      phaseId,
      title,
      description,
      order: order || 0,
      active: active !== undefined ? active : true,
    });
    res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/exams/subjects/:id
// @access  Private/Admin
export const updateSubject = async (req, res, next) => {
  try {
    const { title, description, order, active } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (title !== undefined) subject.title = title;
    if (description !== undefined) subject.description = description;
    if (order !== undefined) subject.order = order;
    if (active !== undefined) subject.active = active;

    const updatedSubject = await subject.save();
    res.status(200).json({ message: 'Subject updated successfully', subject: updatedSubject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/exams/subjects/:id
// @access  Private/Admin
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Cascade delete topics
    await Topic.deleteMany({ subjectId: subject._id });
    await subject.deleteOne();

    res.status(200).json({ message: 'Subject and associated topics deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── TOPICS ───

// @desc    Create topic
// @route   POST /api/exams/:examId/topics
// @access  Private/Admin
export const createTopic = async (req, res, next) => {
  try {
    const { phaseId, subjectId, title, description, subtopics, estimatedStudyHours, order, active } = req.body;
    const topic = await Topic.create({
      examId: req.params.examId,
      phaseId,
      subjectId,
      title,
      description,
      subtopics: subtopics || [],
      estimatedStudyHours: estimatedStudyHours || 0,
      order: order || 0,
      active: active !== undefined ? active : true,
    });
    res.status(201).json({ message: 'Topic created successfully', topic });
  } catch (error) {
    next(error);
  }
};

// @desc    Update topic
// @route   PUT /api/exams/topics/:id
// @access  Private/Admin
export const updateTopic = async (req, res, next) => {
  try {
    const { title, description, subtopics, estimatedStudyHours, order, active } = req.body;
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (title !== undefined) topic.title = title;
    if (description !== undefined) topic.description = description;
    if (subtopics !== undefined) topic.subtopics = subtopics;
    if (estimatedStudyHours !== undefined) topic.estimatedStudyHours = estimatedStudyHours;
    if (order !== undefined) topic.order = order;
    if (active !== undefined) topic.active = active;

    const updatedTopic = await topic.save();
    res.status(200).json({ message: 'Topic updated successfully', topic: updatedTopic });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete topic
// @route   DELETE /api/exams/topics/:id
// @access  Private/Admin
export const deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    await topic.deleteOne();
    res.status(200).json({ message: 'Topic deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subtopics of a topic
// @route   GET /api/exams/topics/:topicId/subtopics
// @access  Public
export const getSubtopicsOfTopic = async (req, res, next) => {
  try {
    const subtopics = await Subtopic.find({ topicId: req.params.topicId }).sort('order');
    res.status(200).json(subtopics);
  } catch (error) {
    next(error);
  }
};

// ─── SUBTOPICS ───

// @desc    Create subtopic
// @route   POST /api/exams/:examId/subtopics
// @access  Private/Admin
export const createSubtopic = async (req, res, next) => {
  try {
    const { phaseId, subjectId, topicId, title, description, estimatedWeightage, displayOrder, questionTarget, pyqTarget, languageSupport } = req.body;
    if (!topicId) return res.status(400).json({ message: 'topicId is required.' });

    const slug = makeSlug(title);
    const existing = await Subtopic.findOne({ topicId, slug });
    if (existing) return res.status(400).json({ message: 'A subtopic with this name already exists under this topic.' });

    const subtopic = await Subtopic.create({
      examId: req.params.examId,
      phaseId,
      subjectId,
      topicId,
      title,
      slug,
      description: description || '',
      estimatedWeightage: estimatedWeightage || 'medium',
      recommendedStudyOrder: displayOrder || 0,
      displayOrder: displayOrder || 0,
      order: displayOrder || 0,
      questionTarget: questionTarget || 30,
      pyqTarget: pyqTarget || 3,
      languageSupport: languageSupport || 'bilingual',
      active: true,
      isPublished: true,
      isArchived: false,
      createdBy: req.user._id,
    });
    res.status(201).json({ message: 'Subtopic created successfully', subtopic });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subtopic
// @route   PUT /api/exams/subtopics/:id
// @access  Private/Admin
export const updateSubtopic = async (req, res, next) => {
  try {
    const { title, description, estimatedWeightage, displayOrder, questionTarget, pyqTarget, languageSupport, active } = req.body;
    const subtopic = await Subtopic.findById(req.params.id);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });

    if (title !== undefined) {
      subtopic.title = title;
      subtopic.slug = makeSlug(title);
    }
    if (description !== undefined)       subtopic.description = description;
    if (estimatedWeightage !== undefined) subtopic.estimatedWeightage = estimatedWeightage;
    if (displayOrder !== undefined) {
      subtopic.displayOrder = Number(displayOrder);
      subtopic.order = Number(displayOrder);
      subtopic.recommendedStudyOrder = Number(displayOrder);
    }
    if (questionTarget !== undefined)    subtopic.questionTarget = Number(questionTarget);
    if (pyqTarget !== undefined)         subtopic.pyqTarget = Number(pyqTarget);
    if (languageSupport !== undefined)   subtopic.languageSupport = languageSupport;
    if (active !== undefined)            subtopic.active = !!active;

    const updated = await subtopic.save();
    res.status(200).json({ message: 'Subtopic updated successfully', subtopic: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subtopic
// @route   DELETE /api/exams/subtopics/:id
// @access  Private/Admin
export const deleteSubtopic = async (req, res, next) => {
  try {
    const subtopic = await Subtopic.findById(req.params.id);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });
    await subtopic.deleteOne();
    res.status(200).json({ message: 'Subtopic deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── PUBLISH / ARCHIVE TOGGLES ───

const MODEL_MAP = { exam: Exam, phase: ExamPhase, subject: Subject, topic: Topic, subtopic: Subtopic };

// @desc    Toggle isPublished flag for any syllabus node
// @route   PATCH /api/exams/:nodeType/:id/publish
// @access  Private/Admin
export const togglePublish = async (req, res, next) => {
  try {
    const { nodeType, id } = req.params;
    const Model = MODEL_MAP[nodeType];
    if (!Model) return res.status(400).json({ message: 'Invalid node type.' });

    const doc = await Model.findById(id);
    if (!doc) return res.status(404).json({ message: `${nodeType} not found.` });
    doc.isPublished = !doc.isPublished;
    await doc.save();
    res.status(200).json({ success: true, isPublished: doc.isPublished });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle isArchived flag for any syllabus node
// @route   PATCH /api/exams/:nodeType/:id/archive
// @access  Private/Admin
export const toggleArchive = async (req, res, next) => {
  try {
    const { nodeType, id } = req.params;
    const Model = MODEL_MAP[nodeType];
    if (!Model) return res.status(400).json({ message: 'Invalid node type.' });

    const doc = await Model.findById(id);
    if (!doc) return res.status(404).json({ message: `${nodeType} not found.` });
    doc.isArchived = !doc.isArchived;
    if (doc.isArchived) doc.active = false;
    else doc.active = true;
    await doc.save();
    res.status(200).json({ success: true, isArchived: doc.isArchived });
  } catch (error) {
    next(error);
  }
};
