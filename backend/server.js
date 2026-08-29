import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Load config
dotenv.config();

// Connect DB
import connectDB from './config/db.js';
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());

// CORS Configuration - Allow multiple origins for development and production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173', // Development
      'http://localhost:3000',  // Alternative dev port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads folder as static directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Health Check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TargetRank API is running smoothly',
    timestamp: new Date()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('TargetRank API is active.');
});

// ── API Routes ─────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import testRoutes from './routes/testRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);

import contentRoutes from './routes/contentRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import revisionRoutes from './routes/revisionRoutes.js';
import generationRoutes from './routes/generationRoutes.js';
import adminPreviousYearPaperRoutes from './routes/adminPreviousYearPaperRoutes.js';
import previousYearPaperRoutes from './routes/previousYearPaperRoutes.js';
import adminDescriptiveQuestionRoutes from './routes/adminDescriptiveQuestionRoutes.js';
import answerWritingRoutes from './routes/answerWritingRoutes.js';
import mentorAnswerReviewRoutes from './routes/mentorAnswerReviewRoutes.js';
import adminSyllabusRoutes from './routes/adminSyllabusRoutes.js';
import adminQuestionImportRoutes from './routes/adminQuestionImportRoutes.js';
import adminMockTestRoutes from './routes/adminMockTestRoutes.js';
import mockTestRoutes from './routes/mockTestRoutes.js';
import adminPYQRoutes from './routes/adminPYQRoutes.js';
import pyqRoutes from './routes/pyqRoutes.js';
import adminCurrentAffairsRoutes from './routes/adminCurrentAffairsRoutes.js';
import currentAffairsRoutes from './routes/currentAffairsRoutes.js';
import adminQuestionLibraryRoutes from './routes/adminQuestionLibraryRoutes.js';

app.use('/api/content', contentRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/revision', revisionRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/admin/previous-year-papers', adminPreviousYearPaperRoutes);
app.use('/api/previous-year-papers', previousYearPaperRoutes);
app.use('/api/admin/descriptive-questions', adminDescriptiveQuestionRoutes);
app.use('/api/answer-writing', answerWritingRoutes);
app.use('/api/mentor/answer-submissions', mentorAnswerReviewRoutes);
app.use('/api/admin/syllabus', adminSyllabusRoutes);
app.use('/api/admin/question-import', adminQuestionImportRoutes);
app.use('/api/admin/mock-tests', adminMockTestRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/admin/pyq-papers', adminPYQRoutes);
app.use('/api/pyq-papers', pyqRoutes);
app.use('/api/admin/current-affairs', adminCurrentAffairsRoutes);
app.use('/api/current-affairs', currentAffairsRoutes);
app.use('/api/admin/questions/library', adminQuestionLibraryRoutes);

import adminTutorialRoutes from './routes/adminTutorialRoutes.js';
import tutorialRoutes from './routes/tutorialRoutes.js';

app.use('/api/admin/tutorials', adminTutorialRoutes);
app.use('/api/tutorials', tutorialRoutes);

import contentIntelligenceRoutes from './routes/contentIntelligenceRoutes.js';
app.use('/api/content/intelligence', contentIntelligenceRoutes);

import dashboardRoutes from './routes/dashboardRoutes.js';
app.use('/api', dashboardRoutes);

// Error handling middleware
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
