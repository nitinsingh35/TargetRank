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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedQuestions = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // 1. Fetch Admin User
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found. Please run syllabus seed first.');
      process.exit(1);
    }

    // 2. Clear old questions
    console.log('Clearing old Question records...');
    await Question.deleteMany({});
    console.log('Cleared.');

    // 3. Fetch Syllabus references for mapping
    const upsc = await Exam.findOne({ slug: 'upsc-cse' });
    const bpsc = await Exam.findOne({ slug: 'bpsc-pcs' });
    const ssc = await Exam.findOne({ slug: 'ssc-cgl' });
    const banking = await Exam.findOne({ slug: 'banking-po' });

    if (!upsc || !bpsc || !ssc || !banking) {
      console.log('Syllabus seed data not fully seeded. Running syllabus seed first is required.');
      process.exit(1);
    }

    // UPSC Phase, Subject, Topic references
    const upscPhase1 = await ExamPhase.findOne({ examId: upsc._id, title: 'Preliminary Examination' });
    const upscGS1 = await Subject.findOne({ examId: upsc._id, phaseId: upscPhase1._id, title: 'General Studies I' });
    const upscCSAT = await Subject.findOne({ examId: upsc._id, phaseId: upscPhase1._id, title: 'CSAT (GS Paper II)' });
    
    const upscPolityTopic = await Topic.findOne({ subjectId: upscGS1._id, title: 'Indian Polity & Governance' });
    const upscGeoTopic = await Topic.findOne({ subjectId: upscGS1._id, title: 'Physical Geography of India' });
    const upscCSATTopic = await Topic.findOne({ subjectId: upscCSAT._id, title: 'Basic Numeracy' });

    // BPSC References
    const bpscPhase1 = await ExamPhase.findOne({ examId: bpsc._id, title: 'Preliminary Exam' });
    const bpscSpecial = await Subject.findOne({ examId: bpsc._id, phaseId: bpscPhase1._id, title: 'Bihar Special' });
    const bpscHistoryTopic = await Topic.findOne({ subjectId: bpscSpecial._id, title: 'Bihar History & Freedom Struggle' });

    // SSC CGL References
    const sscPhase1 = await ExamPhase.findOne({ examId: ssc._id, title: 'Tier I Exam' });
    const sscQuant = await Subject.findOne({ examId: ssc._id, phaseId: sscPhase1._id, title: 'Quantitative Aptitude' });
    const sscArithmeticTopic = await Topic.findOne({ subjectId: sscQuant._id, title: 'Arithmetic Operations' });

    // Banking References
    const bankPhase2 = await ExamPhase.findOne({ examId: banking._id, title: 'Mains Exam' });
    const bankSyllabusSubject = await Subject.findOne({ examId: banking._id, phaseId: bankPhase2._id, title: 'Banking Awareness' });
    const bankRBI = await Topic.findOne({ subjectId: bankSyllabusSubject._id, title: 'Reserve Bank of India & Banking History' });

    console.log('Reference IDs mapped. Creating questions...');

    const sampleQuestions = [
      // ────────────────── UPSC CSE QUESTIONS ──────────────────
      {
        examId: upsc._id,
        phaseId: upscPhase1._id,
        subjectId: upscGS1._id,
        topicId: upscPolityTopic._id,
        questionType: 'mcq',
        questionText: 'Under the Indian Constitution, which of the following is NOT a fundamental duty of citizens?',
        options: [
          'To safeguard public property',
          'To develop scientific temper',
          'To vote in public elections',
          'To abide by the Constitution and respect its ideals'
        ],
        correctAnswer: 'To vote in public elections',
        explanation: 'Voting in public elections is a constitutional/statutory right under Article 326 of the Constitution, but it is not listed among the 11 Fundamental Duties under Article 51A.',
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        year: 2021,
        source: 'UPSC CSE Prelims',
        category: 'Indian Polity',
        tags: ['Fundamental Duties', 'Article 51A'],
        status: 'published',
        createdBy: admin._id,
      },
      {
        examId: upsc._id,
        phaseId: upscPhase1._id,
        subjectId: upscGS1._id,
        topicId: upscGeoTopic._id,
        questionType: 'mcq',
        questionText: 'Consider the following statements regarding the Monsoons in India:\n1. The south-west monsoon enters the country through the Malabar coast first.\n2. The retreat of the monsoon starts from North-West India by September.\nWhich of the statements given above is/are correct?',
        options: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2'
        ],
        correctAnswer: 'Both 1 and 2',
        explanation: 'South-west monsoon winds usually hit Kerala (Malabar Coast) in early June. The withdrawal/retreat starts from North-West India by the first week of September.',
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        year: 2022,
        source: 'UPSC CSE Prelims',
        category: 'Geography',
        tags: ['Monsoon', 'Climate'],
        status: 'published',
        createdBy: admin._id,
      },
      {
        examId: upsc._id,
        phaseId: upscPhase1._id,
        subjectId: upscCSAT._id,
        topicId: upscCSATTopic._id,
        questionType: 'mcq',
        questionText: 'If 30% of a number is equal to two-fifths of another number, what is the ratio of the first number to the second number?',
        options: [
          '3:4',
          '4:3',
          '3:5',
          '5:3'
        ],
        correctAnswer: '4:3',
        explanation: 'Let the numbers be x and y.\n30% of x = 2/5 of y => (30/100)*x = (2/5)*y => 0.3*x = 0.4*y => x/y = 4/3. Thus the ratio is 4:3.',
        difficulty: 'easy',
        marks: 2.5,
        negativeMarks: 0.83,
        year: 2020,
        source: 'UPSC CSAT Paper II',
        category: 'Mathematics',
        tags: ['CSAT Ratio', 'Percentage'],
        status: 'published',
        createdBy: admin._id,
      },

      // ────────────────── BPSC QUESTIONS ──────────────────
      {
        examId: bpsc._id,
        phaseId: bpscPhase1._id,
        subjectId: bpscSpecial._id,
        topicId: bpscHistoryTopic._id,
        questionType: 'mcq',
        questionText: 'Who was selected by Mahatma Gandhi to lead the Champaran Satyagraha in Bihar to assist the indigo farmers?',
        options: [
          'Rajendra Prasad',
          'Raj Kumar Shukla',
          'J.B. Kripalani',
          'None of the above'
        ],
        correctAnswer: 'Raj Kumar Shukla',
        explanation: 'Raj Kumar Shukla was the indigo cultivator who persuaded Mahatma Gandhi to visit Champaran to look into the grievances of the farmers under the Tinkathia system.',
        difficulty: 'easy',
        marks: 1,
        negativeMarks: 0.25,
        year: 2018,
        source: '64th BPSC Prelims',
        category: 'State-specific GK',
        tags: ['Champaran Satyagraha', 'Bihar Freedom Struggle'],
        status: 'published',
        createdBy: admin._id,
      },

      // ────────────────── SSC CGL QUESTIONS ──────────────────
      {
        examId: ssc._id,
        phaseId: sscPhase1._id,
        subjectId: sscQuant._id,
        topicId: sscArithmeticTopic._id,
        questionType: 'mcq',
        questionText: 'A dealer marks his goods 20% above the cost price and allows a discount of 10%. What is his overall gain percentage?',
        options: [
          '8%',
          '10%',
          '12%',
          '15%'
        ],
        correctAnswer: '8%',
        explanation: 'Let cost price be Rs. 100.\nMarked Price = 100 + 20% of 100 = Rs. 120.\nDiscount = 10% of 120 = Rs. 12.\nSelling Price = 120 - 12 = Rs. 108.\nGain % = (108 - 100) = 8%.',
        difficulty: 'easy',
        marks: 2,
        negativeMarks: 0.5,
        year: 2022,
        source: 'SSC CGL Tier I',
        category: 'Mathematics',
        tags: ['Profit and Loss', 'Aptitude'],
        status: 'published',
        createdBy: admin._id,
      },

      // ────────────────── BANKING QUESTIONS ──────────────────
      {
        examId: banking._id,
        phaseId: bankPhase2._id,
        subjectId: bankSyllabusSubject._id,
        topicId: bankRBI._id,
        questionType: 'mcq',
        questionText: 'Which of the following is the rate at which the RBI lends money to commercial banks in the event of any shortfall of funds?',
        options: [
          'Reverse Repo Rate',
          'Cash Reserve Ratio',
          'Repo Rate',
          'Statutory Liquidity Ratio'
        ],
        correctAnswer: 'Repo Rate',
        explanation: 'Repo rate (Repurchase rate) is the rate at which the central bank of a country (RBI in India) lends money to commercial banks in the event of any shortfall of funds.',
        difficulty: 'medium',
        marks: 1,
        negativeMarks: 0.25,
        year: 2023,
        source: 'SBI PO Mains',
        category: 'Banking Awareness',
        tags: ['Monetary Policy', 'RBI Guidelines'],
        status: 'published',
        createdBy: admin._id,
      }
    ];

    await Question.insertMany(sampleQuestions);
    console.log('Seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
};

seedQuestions();
