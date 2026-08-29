import Question from '../models/Question.js';
import User from '../models/User.js';

// ─── GET QUESTIONS ───
// @desc    Get questions with pagination and sorting
// @route   GET /api/questions
// @access  Public (Aspirants get published questions only, Admins/Mentors get filterable roles)
export const getQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      examId,
      phaseId,
      subjectId,
      topicId,
      difficulty,
      year,
      category,
      questionType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isPYQ,
    } = req.query;

    const query = {};

    // 1. Role-based Access Control for Question Status
    if (!req.user || req.user.role === 'aspirant') {
      query.$or = [
        { status: 'published' },
        { qualityStatus: 'approved', isVerified: true, isPublished: true }
      ];
      query.isArchived = { $ne: true };
    } else if (req.user.role === 'mentor') {
      // Mentors see published questions OR questions they authored
      query.$or = [
        { status: 'published' },
        { qualityStatus: 'approved', isVerified: true, isPublished: true },
        { createdBy: req.user._id }
      ];
      query.isArchived = { $ne: true };
    } else if (req.user.role === 'admin') {
      if (status) {
        query.status = status;
      }
      if (req.query.qualityStatus) query.qualityStatus = req.query.qualityStatus;
      if (req.query.isPublished !== undefined) query.isPublished = req.query.isPublished === 'true';
      if (req.query.sourceType) query.sourceType = req.query.sourceType;
      if (req.query.sourceYear) query.sourceYear = Number(req.query.sourceYear);
      if (req.query.isArchived !== undefined) {
        query.isArchived = req.query.isArchived === 'true';
      }
    }

    // 2. Filter mappings
    if (examId) query.examId = examId;
    if (phaseId) query.phaseId = phaseId;
    if (subjectId) query.subjectId = subjectId;
    if (topicId) query.topicId = topicId;
    if (difficulty) query.difficulty = difficulty;
    if (year) query.year = Number(year);
    if (category) query.category = category;
    if (questionType) query.questionType = questionType;
    if (isPYQ === 'true') {
      query.year = { $exists: true, $ne: null };
    }

    // 3. Search keyword logic (scans text, explanation, or tags)
    if (search) {
      const cleanSearch = search.trim();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { questionText: { $regex: cleanSearch, $options: 'i' } },
          { explanation: { $regex: cleanSearch, $options: 'i' } },
          { tags: { $regex: cleanSearch, $options: 'i' } }
        ]
      });
    }

    // 4. Executing paginated query
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const order = sortOrder === 'asc' ? 1 : -1;
    const questions = await Question.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limitNum)
      .populate('examId', 'title')
      .populate('subjectId', 'title');

    const total = await Question.countDocuments(query);

    res.status(200).json({
      questions,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

// ─── CRUD CREATION & MODERATION ───

// @desc    Create question manually
// @route   POST /api/questions
// @access  Private/Mentor or Admin
export const createQuestion = async (req, res, next) => {
  try {
    const {
      examId,
      phaseId,
      subjectId,
      topicId,
      questionType,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      marks,
      negativeMarks,
      year,
      source,
      category,
      tags,
      language,
    } = req.body;

    const status = req.user.role === 'admin' ? 'published' : 'pending_review';

    const question = await Question.create({
      examId: examId || null,
      phaseId: phaseId || null,
      subjectId: subjectId || null,
      topicId: topicId || null,
      questionType: questionType || 'mcq',
      questionText,
      options: options || [],
      correctAnswer,
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      marks: marks || 2,
      negativeMarks: negativeMarks || 0,
      year: year ? Number(year) : null,
      source: source || '',
      category,
      tags: tags || [],
      language: language || 'en',
      status,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: status === 'published' ? 'Question published successfully' : 'Question submitted for review',
      question,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private/Mentor or Admin
export const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Role verification: Mentors can only edit their own questions
    if (req.user.role === 'mentor' && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only edit questions you authored.' });
    }

    const {
      examId,
      phaseId,
      subjectId,
      topicId,
      questionType,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      marks,
      negativeMarks,
      year,
      source,
      category,
      tags,
      language,
      status, // Admin only
    } = req.body;

    if (examId !== undefined) question.examId = examId || null;
    if (phaseId !== undefined) question.phaseId = phaseId || null;
    if (subjectId !== undefined) question.subjectId = subjectId || null;
    if (topicId !== undefined) question.topicId = topicId || null;
    if (questionType !== undefined) question.questionType = questionType;
    if (questionText !== undefined) question.questionText = questionText;
    if (options !== undefined) question.options = options;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (explanation !== undefined) question.explanation = explanation;
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (marks !== undefined) question.marks = marks;
    if (negativeMarks !== undefined) question.negativeMarks = negativeMarks;
    if (year !== undefined) question.year = year ? Number(year) : null;
    if (source !== undefined) question.source = source;
    if (category !== undefined) question.category = category;
    if (tags !== undefined) question.tags = tags;
    if (language !== undefined) question.language = language;

    // Admin audit trail changes status
    if (req.user.role === 'admin' && status !== undefined) {
      question.status = status;
      if (status === 'published') {
        question.reviewedBy = req.user._id;
      }
    } else if (req.user.role === 'mentor') {
      // Modifying sets it back to pending
      question.status = 'pending_review';
    }

    const updated = await question.save();
    res.status(200).json({ message: 'Question updated successfully', question: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
export const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.deleteOne();
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and Publish question
// @route   POST /api/questions/:id/review
// @access  Private/Admin
export const reviewQuestion = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['published', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid review status (must be published or rejected).' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    question.status = status;
    question.reviewedBy = req.user._id;
    await question.save();

    res.status(200).json({ message: `Question status updated to ${status}.`, question });
  } catch (error) {
    next(error);
  }
};

// ─── BOOKMARK MANAGEMENT ───

// @desc    Toggle bookmark status of a question
// @route   POST /api/questions/:id/bookmark
// @access  Private/Protected
export const toggleBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const qid = req.params.id;

    const isBookmarked = user.bookmarks.includes(qid);
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(b => b.toString() !== qid.toString());
      await user.save();
      return res.status(200).json({ message: 'Bookmark removed', bookmarked: false });
    } else {
      user.bookmarks.push(qid);
      await user.save();
      return res.status(200).json({ message: 'Bookmark added', bookmarked: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookmarked questions for current user
// @route   GET /api/questions/bookmarks
// @access  Private/Protected
export const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'examId subjectId', select: 'title' }
    });
    res.status(200).json(user.bookmarks);
  } catch (error) {
    next(error);
  }
};

// ─── CSV TEMPLATE AND BULK UPLOAD ───

// @desc    Get downloadable CSV Template
// @route   GET /api/questions/template
// @access  Private/Mentor or Admin
export const getCSVTemplate = (req, res) => {
  const headers = 'category,questionText,options,correctAnswer,explanation,difficulty,marks,negativeMarks,year,source,tags\n';
  const sampleRow = '"General Studies","Who was the first President of India?","Dr. Rajendra Prasad|Dr. S. Radhakrishnan|Pranab Mukherjee|Zakir Husain","Dr. Rajendra Prasad","Dr. Rajendra Prasad served as the first President of the Republic of India from 1950 to 1962.","easy",2,0.66,1995,"UPSC GS I","history,polity"\n';

  res.setHeader('Content-Type', 'text/csv');
  res.attachment('questions_bulk_template.csv');
  res.status(200).send(headers + sampleRow);
};

// Helper: Custom parsing of CSV lines to account for escaped quotes
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Toggle quotes
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

// @desc    Bulk Upload questions via CSV
// @route   POST /api/questions/bulk-upload
// @access  Private/Mentor or Admin
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a CSV file.' });
    }

    const csvData = req.file.buffer.toString('utf8');
    const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) {
      return res.status(400).json({ message: 'The uploaded file is empty or missing headers.' });
    }

    const headers = parseCSVLine(lines[0]);
    const validCategories = [
      'General Studies', 'General Knowledge', 'Current Affairs', 'Indian Polity',
      'History', 'Geography', 'Economy', 'Environment', 'Science and Technology',
      'Mathematics', 'Reasoning', 'English', 'Computer Awareness', 'Banking Awareness', 'State-specific GK'
    ];

    const insertedQuestions = [];
    const errors = [];

    // Parse each line (skipping header)
    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);
      if (columns.length < 4) {
        errors.push(`Row ${i + 1}: Incomplete fields.`);
        continue;
      }

      const [
        category,
        questionText,
        optionsPipe,
        correctAnswer,
        explanation = '',
        difficulty = 'medium',
        marks = '2',
        negativeMarks = '0',
        year = '',
        source = '',
        tagsComma = ''
      ] = columns;

      // Category validation
      if (!validCategories.includes(category)) {
        errors.push(`Row ${i + 1}: Invalid category "${category}".`);
        continue;
      }

      // Options parsing (separated by pipe |)
      const options = optionsPipe ? optionsPipe.split('|').map(o => o.trim()) : [];
      if (options.length === 0) {
        errors.push(`Row ${i + 1}: Options list cannot be empty.`);
        continue;
      }

      // Check if correct answer matches options
      if (!options.includes(correctAnswer)) {
        errors.push(`Row ${i + 1}: Correct answer must match one of the options.`);
        continue;
      }

      const status = req.user.role === 'admin' ? 'published' : 'pending_review';

      const tagArray = tagsComma ? tagsComma.split('|').map(t => t.trim()) : [];

      insertedQuestions.push({
        category,
        questionText,
        options,
        correctAnswer,
        explanation,
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
        marks: Number(marks) || 2,
        negativeMarks: Number(negativeMarks) || 0,
        year: year ? Number(year) : null,
        source: source || '',
        tags: tagArray,
        status,
        createdBy: req.user._id,
      });
    }

    if (insertedQuestions.length > 0) {
      await Question.insertMany(insertedQuestions);
    }

    res.status(201).json({
      message: `Successfully uploaded ${insertedQuestions.length} questions.`,
      recordsUploaded: insertedQuestions.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};
