import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import ContentCoverageTarget from '../models/ContentCoverageTarget.js';
import ExamPracticeConfig from '../models/ExamPracticeConfig.js';
import FactBank from '../models/FactBank.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Admin user not found. Please seed syllabus first.');
      process.exit(1);
    }

    // 1. Clear old configs
    console.log('Clearing coverage targets and practice configs...');
    await ContentCoverageTarget.deleteMany({});
    await ExamPracticeConfig.deleteMany({});
    await FactBank.deleteMany({});
    console.log('Cleared.');

    // 2. Fetch Exams and Syllabus Topics to map targets
    const upsc = await Exam.findOne({ slug: 'upsc-cse' });
    const bpsc = await Exam.findOne({ slug: 'bpsc-pcs' });
    const ssc = await Exam.findOne({ slug: 'ssc-cgl' });
    const banking = await Exam.findOne({ slug: 'banking-po' });

    if (upsc) {
      const prelims = await ExamPhase.findOne({ examId: upsc._id, title: 'Preliminary Examination' });
      const gs1 = await Subject.findOne({ examId: upsc._id, title: 'General Studies I' });
      const polityTopic = await Topic.findOne({ examId: upsc._id, subjectId: gs1?._id });

      // Create UPSC Practice Config
      await ExamPracticeConfig.create({
        examId: upsc._id,
        phaseId: prelims?._id,
        defaultMinutesPerQuestion: 2.0,
        defaultMarksPerQuestion: 2.0,
        defaultNegativeMarks: 0.66,
        updatedBy: admin._id,
      });

      // Create Polity Target
      if (gs1 && polityTopic) {
        await ContentCoverageTarget.create({
          examId: upsc._id,
          phaseId: prelims?._id,
          subjectId: gs1._id,
          topicId: polityTopic._id,
          targetQuestionCount: 5000,
          targetPYQCount: 1000,
        });
      }

      // Create Polity FactBank seeds
      if (gs1 && polityTopic) {
        await FactBank.create([
          {
            examId: upsc._id,
            subjectId: gs1._id,
            topicId: polityTopic._id,
            factText: 'The Right to Information (RTI) is a fundamental right derived from Article 19(1)(a) of the Indian Constitution.',
            sourceReference: 'Supreme Court Case: Raj Narain v. State of UP',
            verified: true,
            verifiedBy: admin._id,
            tags: ['Polity', 'Fundamental Rights', 'RTI'],
          },
          {
            examId: upsc._id,
            subjectId: gs1._id,
            topicId: polityTopic._id,
            factText: 'The concept of judicial review in India is inspired by the United States Constitution, though its application matches standard basic structure limits.',
            sourceReference: 'Kesavananda Bharati case 1973',
            verified: true,
            verifiedBy: admin._id,
            tags: ['Polity', 'Judicial Review'],
          }
        ]);
      }
    }

    if (ssc) {
      const tier1 = await ExamPhase.findOne({ examId: ssc._id, title: 'Tier I Exam' });
      const quant = await Subject.findOne({ examId: ssc._id, title: 'Quantitative Aptitude' });
      const algebra = await Topic.findOne({ examId: ssc._id, subjectId: quant?._id });

      // Create SSC practice config
      await ExamPracticeConfig.create({
        examId: ssc._id,
        phaseId: tier1?._id,
        defaultMinutesPerQuestion: 1.0,
        defaultMarksPerQuestion: 2.0,
        defaultNegativeMarks: 0.50,
        updatedBy: admin._id,
      });

      if (quant && algebra) {
        await ContentCoverageTarget.create({
          examId: ssc._id,
          phaseId: tier1?._id,
          subjectId: quant._id,
          topicId: algebra._id,
          targetQuestionCount: 10000,
          targetPYQCount: 1500,
        });
      }
    }

    if (banking) {
      const mains = await ExamPhase.findOne({ examId: banking._id, title: 'Mains Exam' });
      const bankSubject = await Subject.findOne({ examId: banking._id, title: 'Banking Awareness' });
      const policyTopic = await Topic.findOne({ examId: banking._id, subjectId: bankSubject?._id });

      // Create Banking practice config
      await ExamPracticeConfig.create({
        examId: banking._id,
        phaseId: mains?._id,
        defaultMinutesPerQuestion: 1.0,
        defaultMarksPerQuestion: 1.0,
        defaultNegativeMarks: 0.25,
        updatedBy: admin._id,
      });

      if (bankSubject && policyTopic) {
        await ContentCoverageTarget.create({
          examId: banking._id,
          phaseId: mains?._id,
          subjectId: bankSubject._id,
          topicId: policyTopic._id,
          targetQuestionCount: 5000,
          targetPYQCount: 800,
        });
      }
    }

    console.log('Practice configs, coverage targets, and FactBank seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding coverage data:', error);
    process.exit(1);
  }
};

run();
