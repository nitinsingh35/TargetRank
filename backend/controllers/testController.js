import MockTest from '../models/MockTest.js';
import TestAttempt from '../models/TestAttempt.js';
import Question from '../models/Question.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

// Shuffle Helper
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ─── PUBLIC / ASPIRANT ENDPOINTS ───

// @desc    Get active mock tests
// @route   GET /api/tests
// @access  Private/Aspirant or Admin/Mentor
export const getMockTests = async (req, res, next) => {
  try {
    const { examId, testType } = req.query;
    const filter = { active: true };
    if (examId) filter.examId = examId;
    if (testType) filter.testType = testType;

    const tests = await MockTest.find(filter)
      .sort('-createdAt')
      .populate('examId', 'title')
      .populate('phaseId', 'title');

    res.status(200).json(tests);
  } catch (error) {
    next(error);
  }
};

// @desc    Get mock test details and instructions
// @route   GET /api/tests/:id
// @access  Private/Protected
export const getMockTestById = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id)
      .populate('examId', 'title')
      .populate('phaseId', 'title')
      .populate('subjectIds', 'title');

    if (!test) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    res.status(200).json(test);
  } catch (error) {
    next(error);
  }
};

// @desc    Start mock test attempt
// @route   POST /api/tests/:id/start
// @access  Private/Protected
export const startAttempt = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id).populate('questions');
    if (!test) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    // Attempt constraint validation
    if (!test.allowMultipleAttempts) {
      const existing = await TestAttempt.findOne({ userId: req.user._id, mockTestId: test._id, status: 'submitted' });
      if (existing) {
        return res.status(400).json({ message: 'You have already completed this test, and multiple attempts are disabled.' });
      }
    }

    // Setup attempt
    const attempt = await TestAttempt.create({
      userId: req.user._id,
      mockTestId: test._id,
      answers: {},
      markedForReview: [],
      status: 'in_progress',
      startedAt: new Date(),
    });

    // High fidelity randomization of questions and options order
    const shuffledQuestions = shuffleArray(test.questions);
    const randomizedQuestions = shuffledQuestions.map((q) => {
      const qObj = q.toObject();
      if (qObj.options && qObj.options.length > 0) {
        qObj.options = shuffleArray(qObj.options);
      }
      return qObj;
    });

    res.status(201).json({
      message: 'Test attempt started.',
      attemptId: attempt._id,
      durationMinutes: test.durationMinutes,
      questions: randomizedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/auto-save answers in progress
// @route   POST /api/tests/attempts/:attemptId/save
// @access  Private/Protected
export const saveAttemptProgress = async (req, res, next) => {
  try {
    const { answers, markedForReview } = req.body;
    const attempt = await TestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'This attempt has already been submitted.' });
    }

    // Save maps and review arrays
    if (answers) attempt.answers = answers;
    if (markedForReview) attempt.markedForReview = markedForReview;

    await attempt.save();
    res.status(200).json({ message: 'Progress saved successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit attempt and calculate results
// @route   POST /api/tests/attempts/:attemptId/submit
// @access  Private/Protected
export const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'This attempt has already been submitted.' });
    }

    const test = await MockTest.findById(attempt.mockTestId).populate('questions');
    if (!test) {
      return res.status(404).json({ message: 'Mock test template not found.' });
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let score = 0;

    test.questions.forEach((q) => {
      const qid = q._id.toString();
      const userAnswer = attempt.answers.get(qid);

      if (!userAnswer) {
        unansweredCount++;
      } else if (userAnswer === q.correctAnswer) {
        correctCount++;
        score += q.marks;
      } else {
        incorrectCount++;
        if (test.negativeMarkingEnabled) {
          const deduction = q.negativeMarks > 0 ? q.negativeMarks : (test.negativeMarkingValue * q.marks);
          score -= deduction;
        }
      }
    });

    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    attempt.submittedAt = new Date();
    attempt.timeTakenSeconds = Math.round((attempt.submittedAt - attempt.startedAt) / 1000);
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.score = Math.max(0, parseFloat(score.toFixed(2))); // Floor at 0 marks
    attempt.accuracy = accuracy;
    attempt.status = 'submitted';

    await attempt.save();

    res.status(200).json({
      message: 'Test submitted successfully.',
      attempt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analysis (performance reports)
// @route   GET /api/tests/attempts/:attemptId/result
// @access  Private/Protected
export const getAttemptResult = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId)
      .populate('mockTestId');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt result not found.' });
    }

    // Load full details of questions to build analysis
    const test = await MockTest.findById(attempt.mockTestId._id)
      .populate({
        path: 'questions',
        populate: { path: 'subjectId topicId', select: 'title' }
      });

    // Subject/Topic breakdown reports
    const subjectMap = {};
    const topicMap = {};

    test.questions.forEach((q) => {
      const subName = q.subjectId?.title || 'General';
      const topName = q.topicId?.title || 'General';
      const qid = q._id.toString();
      const userAnswer = attempt.answers.get(qid);

      const isCorrect = userAnswer === q.correctAnswer;
      const isIncorrect = userAnswer && userAnswer !== q.correctAnswer;
      const isUnanswered = !userAnswer;

      // Subject breakdown
      if (!subjectMap[subName]) {
        subjectMap[subName] = { total: 0, correct: 0, incorrect: 0, unanswered: 0, score: 0 };
      }
      subjectMap[subName].total++;
      if (isCorrect) {
        subjectMap[subName].correct++;
        subjectMap[subName].score += q.marks;
      } else if (isIncorrect) {
        subjectMap[subName].incorrect++;
        if (test.negativeMarkingEnabled) {
          subjectMap[subName].score -= q.negativeMarks > 0 ? q.negativeMarks : (test.negativeMarkingValue * q.marks);
        }
      } else {
        subjectMap[subName].unanswered++;
      }

      // Topic breakdown
      if (!topicMap[topName]) {
        topicMap[topName] = { total: 0, correct: 0, incorrect: 0, unanswered: 0, score: 0 };
      }
      topicMap[topName].total++;
      if (isCorrect) {
        topicMap[topName].correct++;
        topicMap[topName].score += q.marks;
      } else if (isIncorrect) {
        topicMap[topName].incorrect++;
        if (test.negativeMarkingEnabled) {
          topicMap[topName].score -= q.negativeMarks > 0 ? q.negativeMarks : (test.negativeMarkingValue * q.marks);
        }
      } else {
        topicMap[topName].unanswered++;
      }
    });

    // Format maps into list arrays for charts
    const subjectPerformance = Object.keys(subjectMap).map((key) => ({
      subject: key,
      ...subjectMap[key],
      score: Math.max(0, parseFloat(subjectMap[key].score.toFixed(2)))
    }));

    const topicPerformance = Object.keys(topicMap).map((key) => ({
      topic: key,
      ...topicMap[key],
      score: Math.max(0, parseFloat(topicMap[key].score.toFixed(2)))
    }));

    res.status(200).json({
      attempt,
      questions: test.questions,
      subjectPerformance,
      topicPerformance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dynamic practice test generator
// @route   POST /api/tests/custom-practice
// @access  Private/Protected
export const generateCustomPractice = async (req, res, next) => {
  try {
    const {
      examId,
      phaseId,
      subjectIds = [],
      topicIds = [],
      questionCount = 10,
      difficulty,
      durationMinutes = 20,
    } = req.body;

    const query = {
      $or: [
        { status: 'published' },
        { qualityStatus: 'approved', isVerified: true, isPublished: true }
      ],
      isArchived: { $ne: true }
    };
    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    if (subjectIds.length > 0) query.subjectId = { $in: subjectIds };
    if (topicIds.length > 0) query.topicId = { $in: topicIds };
    if (difficulty) query.difficulty = difficulty;

    // Fetch matching questions
    const matchingQuestions = await Question.find(query);
    if (matchingQuestions.length === 0) {
      return res.status(404).json({ message: 'No published questions found matching your filter criteria.' });
    }

    // Select random questions matching count
    const shuffled = shuffleArray(matchingQuestions);
    const questionsList = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Calculate marks
    let totalMarks = 0;
    questionsList.forEach(q => { totalMarks += q.marks; });

    // Create dynamically a temporary MockTest template
    const test = await MockTest.create({
      title: `Custom Practice Test (${new Date().toLocaleDateString('en-IN')})`,
      examId: examId || matchingQuestions[0].examId || '6a4d1b13e3499ec45f8c3216', // fallback default
      phaseId: phaseId || matchingQuestions[0].phaseId || '6a4d1b15e3499ec45f8c322c',
      durationMinutes: Number(durationMinutes) || 20,
      totalMarks,
      questions: questionsList.map(q => q._id),
      testType: 'custom_practice',
      allowMultipleAttempts: true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Custom test generated.',
      mockTestId: test._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN / MENTOR CRUD ENDPOINTS ───

// @desc    Create a mock test template
// @route   POST /api/tests
// @access  Private/Admin or Mentor
export const createMockTest = async (req, res, next) => {
  try {
    const {
      title,
      examId,
      phaseId,
      subjectIds,
      topicIds,
      instructions,
      durationMinutes,
      totalMarks,
      negativeMarkingEnabled,
      negativeMarkingValue,
      questions,
      testType,
      startDate,
      endDate,
      allowMultipleAttempts,
      active,
    } = req.body;

    const test = await MockTest.create({
      title,
      examId,
      phaseId,
      subjectIds: subjectIds || [],
      topicIds: topicIds || [],
      instructions,
      durationMinutes: durationMinutes || 60,
      totalMarks: totalMarks || 100,
      negativeMarkingEnabled: negativeMarkingEnabled !== undefined ? negativeMarkingEnabled : true,
      negativeMarkingValue: negativeMarkingValue !== undefined ? negativeMarkingValue : 0.33,
      questions: questions || [],
      testType: testType || 'full_mock',
      startDate,
      endDate,
      allowMultipleAttempts: allowMultipleAttempts !== undefined ? allowMultipleAttempts : true,
      active: active !== undefined ? active : true,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Mock test template created successfully', test });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mock test
// @route   PUT /api/tests/:id
// @access  Private/Admin or Mentor
export const updateMockTest = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const {
      title,
      examId,
      phaseId,
      subjectIds,
      topicIds,
      instructions,
      durationMinutes,
      totalMarks,
      negativeMarkingEnabled,
      negativeMarkingValue,
      questions,
      testType,
      startDate,
      endDate,
      allowMultipleAttempts,
      active,
    } = req.body;

    if (title !== undefined) test.title = title;
    if (examId !== undefined) test.examId = examId;
    if (phaseId !== undefined) test.phaseId = phaseId;
    if (subjectIds !== undefined) test.subjectIds = subjectIds;
    if (topicIds !== undefined) test.topicIds = topicIds;
    if (instructions !== undefined) test.instructions = instructions;
    if (durationMinutes !== undefined) test.durationMinutes = durationMinutes;
    if (totalMarks !== undefined) test.totalMarks = totalMarks;
    if (negativeMarkingEnabled !== undefined) test.negativeMarkingEnabled = negativeMarkingEnabled;
    if (negativeMarkingValue !== undefined) test.negativeMarkingValue = negativeMarkingValue;
    if (questions !== undefined) test.questions = questions;
    if (testType !== undefined) test.testType = testType;
    if (startDate !== undefined) test.startDate = startDate;
    if (endDate !== undefined) test.endDate = endDate;
    if (allowMultipleAttempts !== undefined) test.allowMultipleAttempts = allowMultipleAttempts;
    if (active !== undefined) test.active = active;

    const updated = await test.save();
    res.status(200).json({ message: 'Mock test updated successfully', test: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete mock test
// @route   DELETE /api/tests/:id
// @access  Private/Admin or Mentor
export const deleteMockTest = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    await TestAttempt.deleteMany({ mockTestId: test._id });
    await test.deleteOne();

    res.status(200).json({ message: 'Mock test and attempts deleted successfully' });
  } catch (error) {
    next(error);
  }
};
