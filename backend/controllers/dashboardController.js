import User from '../models/User.js';
import Question from '../models/Question.js';
import MockTest from '../models/MockTest.js';
import QuestionReport from '../models/QuestionReport.js';
import AnswerSubmission from '../models/AnswerSubmission.js';
import PYQPaper from '../models/PYQPaper.js';
import CurrentAffairsPack from '../models/CurrentAffairsPack.js';
import RevisionItem from '../models/RevisionItem.js';
import PracticeSession from '../models/PracticeSession.js';

// ─────────────────────────────────────────────────
// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
// ─────────────────────────────────────────────────
export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'aspirant' });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalQuestions = await Question.countDocuments();
    const totalMockTests = await MockTest.countDocuments();
    const pendingReports = await QuestionReport.countDocuments({ status: { $in: ['open', 'reviewing'] } });
    
    // Fetch a few recent activities (recent registrants, new questions, mock tests, etc.)
    const recentUsers = await User.find({}, 'name role email createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentActivity = recentUsers.map(user => ({
      id: user._id,
      type: 'user_registration',
      message: `New ${user.role} registered: ${user.name} (${user.email})`,
      timestamp: user.createdAt,
    }));

    res.status(200).json({
      success: true,
      dashboard: {
        totalStudents,
        totalMentors,
        totalQuestions,
        totalMockTests,
        pendingReports,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get Mentor Dashboard Stats
// @route   GET /api/mentor/dashboard
// @access  Private/Mentor
// ─────────────────────────────────────────────────
export const getMentorDashboard = async (req, res, next) => {
  try {
    const mentorId = req.user._id;

    // Distinct students who have submitted answers to this mentor
    const distinctStudents = await AnswerSubmission.distinct('userId', { assignedMentorId: mentorId });
    const assignedStudents = distinctStudents.length;

    // Submissions pending review
    const pendingAnswerReviews = await AnswerSubmission.countDocuments({
      assignedMentorId: mentorId,
      status: { $in: ['submitted', 'under_review'] },
    });

    // Recent submissions for this mentor
    const recentSubmissionsRaw = await AnswerSubmission.find({ assignedMentorId: mentorId })
      .populate('userId', 'name email')
      .populate('descriptiveQuestionId', 'questionTitle questionText')
      .sort({ submittedAt: -1, updatedAt: -1 })
      .limit(5)
      .lean();

    const recentSubmissions = recentSubmissionsRaw.map(sub => ({
      _id: sub._id,
      studentName: sub.userId?.name || 'Unknown Student',
      questionTitle: sub.descriptiveQuestionId?.questionTitle || 'Descriptive Answer Submission',
      status: sub.status,
      submittedAt: sub.submittedAt || sub.updatedAt,
    }));

    // Mock upcoming tasks
    const upcomingTasks = [
      { id: '1', title: 'Review pending descriptive copies', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { id: '2', title: 'Verify newly added questions', dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    ];

    res.status(200).json({
      success: true,
      dashboard: {
        assignedStudents,
        pendingAnswerReviews,
        upcomingTasks,
        recentSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get Aspirant/Student Dashboard Stats
// @route   GET /api/aspirant/dashboard
// @access  Private/Aspirant
// ─────────────────────────────────────────────────
export const getAspirantDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Load available content counts
    const mockTutorialsCount = await mongooseModelCount('Tutorial', { status: 'published' });
    const availableMockTests = await MockTest.countDocuments({ status: 'published' });
    
    // Count pyq papers (Check if model has field status or isPublished)
    const availablePYQPapers = await PYQPaper.countDocuments({ isPublished: true });
    
    const currentAffairsPacks = await CurrentAffairsPack.countDocuments({ isPublished: true });
    
    const todayRevisionCount = await RevisionItem.countDocuments({
      userId,
      status: 'pending',
      nextRevisionDate: { $lte: new Date() },
    });

    // Fetch recent practice sessions
    const recentPracticeRaw = await PracticeSession.find({ userId })
      .populate('examId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentPractice = recentPracticeRaw.map(session => ({
      _id: session._id,
      examName: session.examId?.title || 'Practice Session',
      mode: session.practiceMode || session.mode || 'smart_mixed',
      score: session.score || 0,
      totalQuestions: session.questions?.length || 0,
      correctCount: session.correctCount || 0,
      status: session.status,
      createdAt: session.createdAt,
    }));

    // Build recommended actions dynamically
    const recommendedActions = [];
    if (todayRevisionCount > 0) {
      recommendedActions.push({
        actionId: 'revise_today',
        title: 'Revision Deck Due',
        type: 'revision',
        description: `You have ${todayRevisionCount} questions pending in your revision queue. Revisit them to cement memory.`,
      });
    }
    if (recentPractice.length === 0) {
      recommendedActions.push({
        actionId: 'smart_practice',
        title: 'Start First Practice',
        type: 'practice',
        description: 'Set up an adaptive practice session to diagnose your subject strength.',
      });
    }
    if (mockTutorialsCount === 0) {
      recommendedActions.push({
        actionId: 'learn_tutorials',
        title: 'Explore Syllabus Tutorials',
        type: 'tutorial',
        description: 'Study section-wise expert notes and video explanations.',
      });
    }

    res.status(200).json({
      success: true,
      dashboard: {
        welcomeName: req.user.name,
        availableTutorials: mockTutorialsCount,
        availableMockTests,
        availablePYQPapers,
        currentAffairsPacks,
        todayRevisionCount,
        recentPractice,
        recommendedActions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to safely query models that might be created later in the steps
async function mongooseModelCount(modelName, query) {
  try {
    const mongoose = await import('mongoose');
    let Model;
    try {
      Model = mongoose.default.model(modelName);
    } catch {
      // Dynamic import if not registered in mongoose yet
      const schemaPath = `../models/${modelName}.js`;
      await import(schemaPath);
      Model = mongoose.default.model(modelName);
    }
    if (Model) {
      return await Model.countDocuments(query);
    }
    return 0;
  } catch {
    return 0;
  }
}
