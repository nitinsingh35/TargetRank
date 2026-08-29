import TutorialProgress from '../models/TutorialProgress.js';
import Tutorial from '../models/Tutorial.js';

// ─────────────────────────────────────────────────
// ASPIRANT PROGRESS ACTIONS
// ─────────────────────────────────────────────────

// Update or create progress
export const updateProgress = async (req, res, next) => {
  try {
    const { progressPercent, watchedSeconds, isCompleted, personalNote } = req.body;
    const tutorialId = req.params.id;
    const userId = req.user._id;

    // Validate input ranges
    const percent = Math.min(100, Math.max(0, Number(progressPercent) || 0));

    // Find and update or create
    let prog = await TutorialProgress.findOne({ userId, tutorialId });
    
    if (prog) {
      if (percent !== undefined) prog.progressPercent = percent;
      if (watchedSeconds !== undefined) prog.watchedSeconds = Number(watchedSeconds) || 0;
      if (isCompleted !== undefined) {
        prog.isCompleted = isCompleted;
        if (isCompleted && !prog.completedAt) {
          prog.completedAt = new Date();
        } else if (!isCompleted) {
          prog.completedAt = null;
        }
      }
      if (personalNote !== undefined) prog.personalNote = personalNote;
      prog.lastOpenedAt = new Date();
      await prog.save();
    } else {
      prog = await TutorialProgress.create({
        userId,
        tutorialId,
        progressPercent: percent,
        watchedSeconds: Number(watchedSeconds) || 0,
        isCompleted: !!isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastOpenedAt: new Date(),
        personalNote: personalNote || '',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully.',
      progress: prog,
    });
  } catch (error) {
    next(error);
  }
};

// Get learning progress overview
export const getMyLearningProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const progressList = await TutorialProgress.find({ userId })
      .populate({
        path: 'tutorialId',
        select: 'title subjectId durationMinutes tutorialType difficulty status',
        populate: {
          path: 'subjectId',
          select: 'title',
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    // Split completed vs continue learning
    const activeProgress = progressList.filter(p => p.tutorialId && p.tutorialId.status === 'published');
    const continueLearning = activeProgress.filter(p => !p.isCompleted);
    const completedTutorials = activeProgress.filter(p => p.isCompleted);

    // Compute subject-wise statistics
    const subjectStatsMap = {};
    activeProgress.forEach(p => {
      const t = p.tutorialId;
      if (t && t.subjectId) {
        const subTitle = t.subjectId.title;
        if (!subjectStatsMap[subTitle]) {
          subjectStatsMap[subTitle] = { total: 0, completed: 0 };
        }
        subjectStatsMap[subTitle].total += 1;
        if (p.isCompleted) {
          subjectStatsMap[subTitle].completed += 1;
        }
      }
    });

    const subjectStats = Object.entries(subjectStatsMap).map(([subjectName, stats]) => ({
      subjectName,
      completionPercent: Math.round((stats.completed / stats.total) * 100),
      totalTopics: stats.total,
      completedTopics: stats.completed,
    }));

    res.status(200).json({
      success: true,
      continueLearning: continueLearning.map(p => ({
        _id: p._id,
        tutorialId: p.tutorialId._id,
        title: p.tutorialId.title,
        subjectName: p.tutorialId.subjectId?.title || 'General',
        progressPercent: p.progressPercent,
        durationMinutes: p.tutorialId.durationMinutes,
        updatedAt: p.updatedAt,
      })),
      completedTutorials: completedTutorials.map(p => ({
        _id: p._id,
        tutorialId: p.tutorialId._id,
        title: p.tutorialId.title,
        subjectName: p.tutorialId.subjectId?.title || 'General',
        completedAt: p.completedAt || p.updatedAt,
      })),
      subjectStats,
    });
  } catch (error) {
    next(error);
  }
};
