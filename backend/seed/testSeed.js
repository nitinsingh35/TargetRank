import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import MockTest from '../models/MockTest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // 1. Fetch Admin User
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found. Please run syllabus seed first.');
      process.exit(1);
    }

    // 2. Clear old mock tests and attempts
    console.log('Clearing old MockTest templates...');
    await MockTest.deleteMany({});
    console.log('Cleared.');

    // 3. Fetch Exam, Phase, and Question references
    const upsc = await Exam.findOne({ slug: 'upsc-cse' });
    const bpsc = await Exam.findOne({ slug: 'bpsc-pcs' });
    const ssc = await Exam.findOne({ slug: 'ssc-cgl' });
    const banking = await Exam.findOne({ slug: 'banking-po' });

    if (!upsc || !bpsc || !ssc || !banking) {
      console.log('Seed exams not found. Run syllabus seed and question seed first.');
      process.exit(1);
    }

    const upscPhase1 = await ExamPhase.findOne({ examId: upsc._id, title: 'Preliminary Examination' });
    const bpscPhase1 = await ExamPhase.findOne({ examId: bpsc._id, title: 'Preliminary Exam' });
    const sscPhase1 = await ExamPhase.findOne({ examId: ssc._id, title: 'Tier I Exam' });
    const bankPhase2 = await ExamPhase.findOne({ examId: banking._id, title: 'Mains Exam' });

    // Fetch questions by examId
    const upscQuestions = await Question.find({ examId: upsc._id });
    const bpscQuestions = await Question.find({ examId: bpsc._id });
    const sscQuestions = await Question.find({ examId: ssc._id });
    const bankQuestions = await Question.find({ examId: banking._id });

    console.log('Mapped reference pointers. Creating mock test configurations...');

    // A. UPSC Prelims Mock Test
    await MockTest.create({
      title: 'UPSC CSE GS Prelims Full Mock #1',
      examId: upsc._id,
      phaseId: upscPhase1._id,
      instructions: '1. This test comprises original UPSC level objective questions.\n2. Total duration is 10 minutes.\n3. Each question carries 2 marks. 0.66 marks deduction applies for wrong options.',
      durationMinutes: 10,
      totalMarks: upscQuestions.reduce((acc, q) => acc + q.marks, 0) || 4,
      negativeMarkingEnabled: true,
      negativeMarkingValue: 0.33,
      questions: upscQuestions.map(q => q._id),
      testType: 'full_mock',
      allowMultipleAttempts: true,
      active: true,
      createdBy: admin._id,
    });

    // B. BPSC Prelims Mock Test
    await MockTest.create({
      title: 'BPSC Prelims Combined Practice Quiz',
      examId: bpsc._id,
      phaseId: bpscPhase1._id,
      instructions: '1. Standard Bihar State Combined PCS pattern questions.\n2. Total duration: 10 minutes.\n3. 1 mark per question. 0.25 negative marks deduction applies.',
      durationMinutes: 10,
      totalMarks: bpscQuestions.reduce((acc, q) => acc + q.marks, 0) || 1,
      negativeMarkingEnabled: true,
      negativeMarkingValue: 0.25,
      questions: bpscQuestions.map(q => q._id),
      testType: 'daily_quiz',
      allowMultipleAttempts: true,
      active: true,
      createdBy: admin._id,
    });

    // C. SSC CGL Tier 1 Mock Test
    await MockTest.create({
      title: 'SSC CGL Tier 1 Quantitative Practice Set',
      examId: ssc._id,
      phaseId: sscPhase1._id,
      instructions: '1. Arithmetic and Algebra section mocks.\n2. Duration: 10 minutes.\n3. 2 marks per question, 0.50 marks negative marks deduction.',
      durationMinutes: 10,
      totalMarks: sscQuestions.reduce((acc, q) => acc + q.marks, 0) || 2,
      negativeMarkingEnabled: true,
      negativeMarkingValue: 0.25, // 0.25 * 2 = 0.50
      questions: sscQuestions.map(q => q._id),
      testType: 'subject_test',
      allowMultipleAttempts: true,
      active: true,
      createdBy: admin._id,
    });

    // D. Banking Prelims Mock Test
    await MockTest.create({
      title: 'Banking Mains Financial & Banking Awareness Mock',
      examId: banking._id,
      phaseId: bankPhase2._id,
      instructions: '1. Timed banking guidelines speed check.\n2. Duration: 10 minutes.\n3. 1 mark per correct key, 0.25 deduction per wrong option.',
      durationMinutes: 10,
      totalMarks: bankQuestions.reduce((acc, q) => acc + q.marks, 0) || 1,
      negativeMarkingEnabled: true,
      negativeMarkingValue: 0.25,
      questions: bankQuestions.map(q => q._id),
      testType: 'full_mock',
      allowMultipleAttempts: false, // Prevent reattempts to test block check
      active: true,
      createdBy: admin._id,
    });

    console.log('Mock tests seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding mock tests:', error);
    process.exit(1);
  }
};

seedTests();
