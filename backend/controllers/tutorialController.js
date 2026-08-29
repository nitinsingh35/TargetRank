import Tutorial from '../models/Tutorial.js';
import TutorialProgress from '../models/TutorialProgress.js';

// Helper to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ─────────────────────────────────────────────────
// ADMIN CONTROLLER ACTIONS
// ─────────────────────────────────────────────────

// Create new tutorial
export const createTutorial = async (req, res, next) => {
  try {
    const {
      title,
      shortDescription,
      fullDescription,
      examIds,
      phaseIds,
      subjectId,
      topicId,
      subtopicId,
      tutorialType,
      contentLanguage,
      videoUrl,
      articleContent,
      pdfUrl,
      externalUrl,
      thumbnailUrl,
      durationMinutes,
      difficulty,
      orderNumber,
      isFree,
      status,
    } = req.body;

    if (!title || !shortDescription || !subjectId || !tutorialType) {
      return res.status(400).json({ message: 'Title, short description, subject, and type are required.' });
    }

    // Validation rules per type
    if (tutorialType === 'video' && !videoUrl) {
      return res.status(400).json({ message: 'Video URL is required for video tutorials.' });
    }
    if (tutorialType === 'article' && !articleContent) {
      return res.status(400).json({ message: 'Article content is required for article tutorials.' });
    }
    if (tutorialType === 'pdf' && !pdfUrl) {
      return res.status(400).json({ message: 'PDF URL is required for PDF tutorials.' });
    }
    if (tutorialType === 'external_link' && !externalUrl) {
      return res.status(400).json({ message: 'External URL is required for external link tutorials.' });
    }

    const slug = generateSlug(title);

    const tutorial = await Tutorial.create({
      title,
      slug,
      shortDescription,
      fullDescription,
      examIds: Array.isArray(examIds) ? examIds : [],
      phaseIds: Array.isArray(phaseIds) ? phaseIds : [],
      subjectId,
      topicId: topicId || null,
      subtopicId: subtopicId || null,
      tutorialType,
      contentLanguage: contentLanguage || 'english',
      videoUrl,
      articleContent,
      pdfUrl,
      externalUrl,
      thumbnailUrl,
      durationMinutes: Number(durationMinutes) || 0,
      difficulty: difficulty || 'beginner',
      orderNumber: Number(orderNumber) || 0,
      isFree: isFree !== undefined ? isFree : true,
      status: status || 'draft',
      isPublished: status === 'published',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Tutorial created successfully.',
      tutorial,
    });
  } catch (error) {
    next(error);
  }
};

// List all tutorials (Admin)
export const getAdminTutorials = async (req, res, next) => {
  try {
    const { examId, subjectId, tutorialType, status, search } = req.query;
    const query = {};

    if (examId) query.examIds = examId;
    if (subjectId) query.subjectId = subjectId;
    if (tutorialType) query.tutorialType = tutorialType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const tutorials = await Tutorial.find(query)
      .populate('examIds', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      tutorials: Array.isArray(tutorials) ? tutorials : [],
    });
  } catch (error) {
    next(error);
  }
};

// Get single tutorial details (Admin)
export const getAdminTutorialById = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id)
      .populate('examIds')
      .populate('phaseIds')
      .populate('subjectId')
      .populate('topicId')
      .populate('subtopicId')
      .lean();

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found.' });
    }

    res.status(200).json({
      success: true,
      tutorial,
    });
  } catch (error) {
    next(error);
  }
};

// Update tutorial
export const updateTutorial = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found.' });
    }

    const updateData = { ...req.body };
    if (updateData.title) {
      updateData.slug = generateSlug(updateData.title);
    }

    // Validation rules per type
    const type = updateData.tutorialType || tutorial.tutorialType;
    if (type === 'video' && updateData.videoUrl === '') {
      return res.status(400).json({ message: 'Video URL is required for video tutorials.' });
    }
    if (type === 'article' && updateData.articleContent === '') {
      return res.status(400).json({ message: 'Article content is required for article tutorials.' });
    }
    if (type === 'pdf' && updateData.pdfUrl === '') {
      return res.status(400).json({ message: 'PDF URL is required for PDF tutorials.' });
    }
    if (type === 'external_link' && updateData.externalUrl === '') {
      return res.status(400).json({ message: 'External URL is required for external link tutorials.' });
    }

    // Adapt isPublished flag
    if (updateData.status) {
      updateData.isPublished = updateData.status === 'published';
    }

    const updated = await Tutorial.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Tutorial updated successfully.',
      tutorial: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Publish tutorial
export const publishTutorial = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found.' });
    }

    // Ensure content matches the type requirement before publishing
    if (tutorial.tutorialType === 'video' && !tutorial.videoUrl) {
      return res.status(400).json({ message: 'Cannot publish video tutorial without a Video URL.' });
    }
    if (tutorial.tutorialType === 'article' && !tutorial.articleContent) {
      return res.status(400).json({ message: 'Cannot publish article tutorial without content.' });
    }

    tutorial.status = 'published';
    tutorial.isPublished = true;
    await tutorial.save();

    res.status(200).json({
      success: true,
      message: 'Tutorial published successfully.',
      tutorial,
    });
  } catch (error) {
    next(error);
  }
};

// Archive tutorial
export const archiveTutorial = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'archived', isPublished: false } },
      { new: true }
    );

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Tutorial archived successfully.',
      tutorial,
    });
  } catch (error) {
    next(error);
  }
};

// Delete tutorial
export const deleteTutorial = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findByIdAndDelete(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found.' });
    }

    // Also clean up any associated progress files
    await TutorialProgress.deleteMany({ tutorialId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Tutorial and progress logs deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// ASPIRANT CONTROLLER ACTIONS
// ─────────────────────────────────────────────────

// Fetch published tutorials
export const getAspirantTutorials = async (req, res, next) => {
  try {
    const { examId, phaseId, subjectId, topicId, tutorialType, language, difficulty, search } = req.query;
    const query = { status: 'published' };

    if (examId) query.examIds = examId;
    if (phaseId) query.phaseIds = phaseId;
    if (subjectId) query.subjectId = subjectId;
    if (topicId) query.topicId = topicId;
    if (tutorialType) query.tutorialType = tutorialType;
    if (language) query.contentLanguage = language;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const tutorials = await Tutorial.find(query)
      .populate('examIds', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    // Map progress to each tutorial
    const progressList = await TutorialProgress.find({ userId: req.user._id }).lean();
    const progressMap = new Map(progressList.map(p => [p.tutorialId.toString(), p]));

    const result = tutorials.map(t => {
      const prog = progressMap.get(t._id.toString());
      return {
        ...t,
        progressPercent: prog ? prog.progressPercent : 0,
        isCompleted: prog ? prog.isCompleted : false,
      };
    });

    res.status(200).json({
      success: true,
      tutorials: result,
    });
  } catch (error) {
    next(error);
  }
};

// Fetch single published tutorial details
export const getAspirantTutorialById = async (req, res, next) => {
  try {
    const tutorial = await Tutorial.findOne({ _id: req.params.id, status: 'published' })
      .populate('examIds', 'title')
      .populate('phaseIds', 'title')
      .populate('subjectId', 'title')
      .populate('topicId', 'title')
      .populate('subtopicId', 'title')
      .lean();

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found or not published.' });
    }

    const prog = await TutorialProgress.findOne({
      userId: req.user._id,
      tutorialId: req.params.id,
    }).lean();

    // Get previous/next tutorials for deck navigation
    const siblings = await Tutorial.find({
      subjectId: tutorial.subjectId._id,
      status: 'published',
    })
      .sort({ orderNumber: 1 })
      .select('_id title')
      .lean();

    const currentIndex = siblings.findIndex(s => s._id.toString() === tutorial._id.toString());
    const prevTutorial = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    const nextTutorial = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

    res.status(200).json({
      success: true,
      tutorial,
      progress: prog ? {
        progressPercent: prog.progressPercent,
        watchedSeconds: prog.watchedSeconds,
        isCompleted: prog.isCompleted,
        personalNote: prog.personalNote,
      } : {
        progressPercent: 0,
        watchedSeconds: 0,
        isCompleted: false,
        personalNote: '',
      },
      prevTutorial,
      nextTutorial,
    });
  } catch (error) {
    next(error);
  }
};

// Recommended tutorials
export const getRecommendedTutorials = async (req, res, next) => {
  try {
    // Recommend top published tutorials belonging to user's selected exams
    const query = { status: 'published' };
    if (req.user.selectedExams && req.user.selectedExams.length > 0) {
      // Find Exam records matching these titles/slugs to get their ObjectIds
      const Exam = await import('../models/Exam.js').then(m => m.default);
      const exams = await Exam.find({ title: { $in: req.user.selectedExams } }).select('_id');
      if (exams.length > 0) {
        query.examIds = { $in: exams.map(e => e._id) };
      }
    }

    const tutorials = await Tutorial.find(query)
      .populate('subjectId', 'title')
      .sort({ orderNumber: 1 })
      .limit(4)
      .lean();

    res.status(200).json({
      success: true,
      tutorials,
    });
  } catch (error) {
    next(error);
  }
};
