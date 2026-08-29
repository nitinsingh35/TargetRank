import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load env
dotenv.config();

// Import Models
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';
import Question from '../models/Question.js';
import MockTest from '../models/MockTest.js';
import PYQPaper from '../models/PYQPaper.js';
import CurrentAffairsPack from '../models/CurrentAffairsPack.js';
import CurrentAffairsSource from '../models/CurrentAffairsSource.js';
import Tutorial from '../models/Tutorial.js';
import TutorialProgress from '../models/TutorialProgress.js';
import ExamPhase from '../models/ExamPhase.js';

const resetDatabase = async () => {
  console.log('🔄 Cleaning all TargetRank collections...');
  try {
    await mongoose.connection.db.dropCollection('currentaffairspacks');
  } catch (e) {
    // Ignore if collection does not exist
  }
  await User.deleteMany({});
  await Exam.deleteMany({});
  await ExamPhase.deleteMany({});
  await Subject.deleteMany({});
  await Topic.deleteMany({});
  await Subtopic.deleteMany({});
  await Question.deleteMany({});
  await MockTest.deleteMany({});
  await PYQPaper.deleteMany({});
  await CurrentAffairsSource.deleteMany({});
  await Tutorial.deleteMany({});
  await TutorialProgress.deleteMany({});
  console.log('✅ Collections cleaned.');
};

const run = async () => {
  const isReset = process.argv.includes('--reset');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/targetrank');
    console.log('🔌 Connected to MongoDB');

    if (isReset) {
      await resetDatabase();
    }

    // --- 1. SEED USERS ---
    const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@targetrank.com';
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'Test@123';
    const mentorEmail = process.env.DEMO_MENTOR_EMAIL || 'mentor@targetrank.com';
    const mentorPassword = process.env.DEMO_MENTOR_PASSWORD || 'Test@123';
    const studentEmail = process.env.DEMO_STUDENT_EMAIL || 'aspirant@targetrank.com';
    const studentPassword = process.env.DEMO_STUDENT_PASSWORD || 'Test@123';

    // Upsert Admin
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Demo Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        active: true,
      });
      console.log(`👤 Admin created: ${adminEmail}`);
    }

    // Upsert Mentor
    let mentorUser = await User.findOne({ email: mentorEmail });
    if (!mentorUser) {
      mentorUser = await User.create({
        name: 'Demo Mentor User',
        email: mentorEmail,
        password: mentorPassword,
        role: 'mentor',
        active: true,
      });
      console.log(`👤 Mentor created: ${mentorEmail}`);
    }

    // Upsert Aspirant
    let studentUser = await User.findOne({ email: studentEmail });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Demo Student User',
        email: studentEmail,
        password: studentPassword,
        role: 'aspirant',
        selectedExams: ['UPSC', 'BPSC', 'SSC CGL'],
        active: true,
      });
      console.log(`👤 Aspirant created: ${studentEmail}`);
    }

    // --- 2. SEED EXAMS ---
    const seedExams = [
      { 
        title: 'UPSC', 
        slug: 'upsc',
        shortDescription: 'Union Public Service Commission Examination',
        description: 'Union Public Service Commission Examination', 
        createdBy: adminUser._id 
      },
      { 
        title: 'BPSC', 
        slug: 'bpsc',
        shortDescription: 'Bihar Public Service Commission Examination',
        description: 'Bihar Public Service Commission Examination', 
        createdBy: adminUser._id 
      },
      { 
        title: 'SSC CGL', 
        slug: 'ssc-cgl',
        shortDescription: 'Staff Selection Commission Combined Graduate Level',
        description: 'Staff Selection Commission Combined Graduate Level', 
        createdBy: adminUser._id 
      }
    ];

    const examsMap = {};
    for (const item of seedExams) {
      let ex = await Exam.findOne({ title: item.title });
      if (!ex) {
        ex = await Exam.create(item);
      }
      examsMap[item.title] = ex;
    }
    console.log('✅ Exams seeded.');

    // --- 3. SEED EXAM PHASES ---
    const phaseNames = ['Foundation', 'Prelims', 'Mains', 'Interview'];
    const phasesMap = {}; // key: "Exam_PhaseName"

    for (const examTitle of Object.keys(examsMap)) {
      const exam = examsMap[examTitle];
      for (const pName of phaseNames) {
        let phase = await ExamPhase.findOne({ examId: exam._id, title: pName });
        if (!phase) {
          phase = await ExamPhase.create({
            title: pName,
            slug: pName.toLowerCase(),
            description: `${examTitle} ${pName} Stage`,
            examId: exam._id
          });
        }
        phasesMap[`${examTitle}_${pName}`] = phase;
      }
    }
    console.log('✅ Exam Phases seeded.');

    // --- 4. SEED SUBJECTS, TOPICS, AND SUBTOPICS ---
    // UPSC Subjects
    const upscPrelims = phasesMap['UPSC_Prelims'];
    
    // Polity Subject
    let politySubject = await Subject.findOne({ examId: examsMap['UPSC']._id, title: 'Indian Polity' });
    if (!politySubject) {
      politySubject = await Subject.create({
        title: 'Indian Polity',
        slug: 'indian-polity',
        description: 'Constitution and Governance',
        examId: examsMap['UPSC']._id,
        phaseId: upscPrelims._id
      });
    }

    // Polity Topic
    let FRTopic = await Topic.findOne({ subjectId: politySubject._id, title: 'Fundamental Rights' });
    if (!FRTopic) {
      FRTopic = await Topic.create({
        title: 'Fundamental Rights',
        slug: 'fundamental-rights',
        description: 'Part III of Indian Constitution',
        subjectId: politySubject._id,
        examId: examsMap['UPSC']._id,
        phaseId: upscPrelims._id
      });
    }

    // Polity Subtopic
    let art21Subtopic = await Subtopic.findOne({ topicId: FRTopic._id, title: 'Article 21' });
    if (!art21Subtopic) {
      art21Subtopic = await Subtopic.create({
        title: 'Article 21',
        slug: 'article-21',
        description: 'Protection of Life and Personal Liberty',
        topicId: FRTopic._id,
        subjectId: politySubject._id,
        examId: examsMap['UPSC']._id,
        phaseId: upscPrelims._id
      });
    }

    // UPSC History Subject
    let historySubject = await Subject.findOne({ examId: examsMap['UPSC']._id, title: 'Indian History' });
    if (!historySubject) {
      historySubject = await Subject.create({
        title: 'Indian History',
        slug: 'indian-history',
        description: 'Ancient, Medieval and Modern',
        examId: examsMap['UPSC']._id,
        phaseId: upscPrelims._id
      });
    }

    let modernHistoryTopic = await Topic.findOne({ subjectId: historySubject._id, title: 'Modern History' });
    if (!modernHistoryTopic) {
      modernHistoryTopic = await Topic.create({
        title: 'Modern History',
        slug: 'modern-history',
        description: 'British Raj and Independence Struggle',
        subjectId: historySubject._id,
        examId: examsMap['UPSC']._id,
        phaseId: upscPrelims._id
      });
    }

    // UPSC Geography Subject
    let geoSubject = await Subject.findOne({ examId: examsMap['UPSC']._id, title: 'Geography' });
    if (!geoSubject) {
      geoSubject = await Subject.create({
        title: 'Geography',
        slug: 'geography',
        description: 'Physical, Social and Economic Geography',
        examId: examsMap['UPSC']._id,
        phaseId: upscPrelims._id
      });
    }

    // BPSC GK Subject
    let bpscGkSubject = await Subject.findOne({ examId: examsMap['BPSC']._id, title: 'Bihar Special GK' });
    if (!bpscGkSubject) {
      bpscGkSubject = await Subject.create({
        title: 'Bihar Special GK',
        slug: 'bihar-special-gk',
        description: 'History and Geography of Bihar',
        examId: examsMap['BPSC']._id,
        phaseId: phasesMap['BPSC_Prelims']._id
      });
    }

    // SSC Quant Subject
    let sscQuantSubject = await Subject.findOne({ examId: examsMap['SSC CGL']._id, title: 'Quantitative Aptitude' });
    if (!sscQuantSubject) {
      sscQuantSubject = await Subject.create({
        title: 'Quantitative Aptitude',
        slug: 'quantitative-aptitude',
        description: 'Numerical and Mathematical Abilities',
        examId: examsMap['SSC CGL']._id,
        phaseId: phasesMap['SSC CGL_Prelims']._id
      });
    }

    // SSC Reasoning Subject
    let sscReasonSubject = await Subject.findOne({ examId: examsMap['SSC CGL']._id, title: 'General Intelligence & Reasoning' });
    if (!sscReasonSubject) {
      sscReasonSubject = await Subject.create({
        title: 'General Intelligence & Reasoning',
        slug: 'general-intelligence-reasoning',
        description: 'Verbal and Non-Verbal Reasoning',
        examId: examsMap['SSC CGL']._id,
        phaseId: phasesMap['SSC CGL_Prelims']._id
      });
    }

    // SSC Quant Topic
    let sscQuantTopic = await Topic.findOne({ subjectId: sscQuantSubject._id, title: 'Arithmetic' });
    if (!sscQuantTopic) {
      sscQuantTopic = await Topic.create({
        title: 'Arithmetic',
        slug: 'arithmetic',
        description: 'Arithmetic problems, percentages, profit & loss',
        subjectId: sscQuantSubject._id,
        examId: examsMap['SSC CGL']._id,
        phaseId: phasesMap['SSC CGL_Prelims']._id
      });
    }

    // UPSC Current Affairs Topic
    let caTopic = await Topic.findOne({ subjectId: politySubject._id, title: 'Current Affairs' });
    if (!caTopic) {
      caTopic = await Topic.create({
        title: 'Current Affairs',
        slug: 'current-affairs',
        description: 'Monthly news and national indicators analysis',
        subjectId: politySubject._id,
        examId: examsMap['UPSC']._id,
        phaseId: upscPrelims._id
      });
    }

    console.log('✅ Subjects, Topics and Subtopics seeded.');

    // --- 5. SEED TUTORIALS (12 items) ---
    const tutorialsData = [
      {
        title: '[Demo Content] UPSC Polity: Basic Structure Doctrine',
        slug: 'upsc-polity-basic-structure-doctrine',
        shortDescription: 'Master the history and evolution of the Basic Structure Doctrine in Indian Constitution.',
        fullDescription: 'The Basic Structure Doctrine is an Indian judicial principle most famously asserted in Kesavananda Bharati v. State of Kerala (1973). This note details its origins and evolution through judicial reviews.',
        examIds: [examsMap['UPSC']._id],
        phaseIds: [phasesMap['UPSC_Prelims']._id, phasesMap['UPSC_Mains']._id],
        subjectId: politySubject._id,
        topicId: FRTopic._id,
        tutorialType: 'article',
        contentLanguage: 'english',
        articleContent: '1. ORIGINS:\nIn the early years of the republic, Parliament passed various amendments restricting Fundamental Rights. The Supreme Court in Shankari Prasad (1951) and Sajjan Singh (1965) allowed this.\n\n2. SHIFT:\nIn Golaknath (1967), the court ruled that Parliament cannot restrict Fundamental Rights.\n\n3. THE DOCTRINE:\nIn Kesavananda Bharati (1973), a 13-judge bench ruled that Parliament can amend any part of the Constitution, including Fundamental Rights, provided it does not alter the "Basic Structure" of the document.',
        durationMinutes: 15,
        difficulty: 'beginner',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] UPSC History: Revolt of 1857 Lecture',
        slug: 'upsc-history-revolt-of-1857-lecture',
        shortDescription: 'Understand the causes, outbreak, and impact of the first war of Indian independence.',
        fullDescription: 'Video overview analyzing political, economic, administrative, and immediate factors behind the 1857 uprising.',
        examIds: [examsMap['UPSC']._id],
        phaseIds: [phasesMap['UPSC_Prelims']._id],
        subjectId: historySubject._id,
        topicId: modernHistoryTopic._id,
        tutorialType: 'video',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // dummy placeholder
        durationMinutes: 30,
        difficulty: 'intermediate',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] UPSC Geography: Monsoons & Jet Streams',
        slug: 'upsc-geography-monsoons-jet-streams',
        shortDescription: 'Core notes explaining the mechanism of Indian monsoon winds and jet stream theories.',
        fullDescription: 'Comprehensive notes detailing spatial distribution of rainfall, Tibetan heating, and tropical easterly jet streams.',
        examIds: [examsMap['UPSC']._id],
        phaseIds: [phasesMap['UPSC_Prelims']._id],
        subjectId: geoSubject._id,
        tutorialType: 'notes',
        durationMinutes: 20,
        difficulty: 'advanced',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] UPSC Economy: Fiscal Policy Indicators',
        slug: 'upsc-economy-fiscal-policy-indicators',
        shortDescription: 'Understand fiscal deficits, revenue deficits, and direct/indirect tax ratios.',
        fullDescription: 'A brief guide explaining fiscal tools, budget division, and capital vs revenue calculations.',
        examIds: [examsMap['UPSC']._id],
        phaseIds: [phasesMap['UPSC_Prelims']._id],
        subjectId: politySubject._id, // reuse polity subject as placeholder for general
        tutorialType: 'article',
        articleContent: '1. Revenue Deficit: Revenue Expenditure - Revenue Receipts.\n2. Fiscal Deficit: Total Budgeted Expenditure - Total Receipts (excluding borrowings).\n3. Primary Deficit: Fiscal Deficit - Interest Payments.',
        durationMinutes: 10,
        difficulty: 'beginner',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] BPSC Bihar GK: Soil and Rivers of Bihar',
        slug: 'bpsc-bihar-gk-soil-and-rivers-of-bihar',
        shortDescription: 'Learn about major river systems in Bihar including Ganga, Gandak, Kosi, and Sone.',
        fullDescription: 'Comprehensive notes detailing geological structure and river navigation inside Bihar.',
        examIds: [examsMap['BPSC']._id],
        phaseIds: [phasesMap['BPSC_Prelims']._id],
        subjectId: bpscGkSubject._id,
        tutorialType: 'article',
        articleContent: '1. Ganga River divides Bihar into northern and southern regions.\n2. Northern rivers are perennial, originating in the Himalayas, e.g., Gandak, Kosi, Bagmati.\n3. Southern rivers are rainfed, originating in the Chota Nagpur plateau, e.g., Sone, Punpun.',
        durationMinutes: 18,
        difficulty: 'intermediate',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] SSC Reasoning: Syllogism Tricks',
        slug: 'ssc-reasoning-syllogism-tricks',
        shortDescription: 'Venn Diagram shortcuts to solve 3-statement syllogism questions in seconds.',
        fullDescription: 'Tricks and steps to solve complex reasoning statements without errors.',
        examIds: [examsMap['SSC CGL']._id],
        phaseIds: [phasesMap['SSC CGL_Prelims']._id],
        subjectId: sscReasonSubject._id,
        tutorialType: 'notes',
        durationMinutes: 12,
        difficulty: 'beginner',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] SSC Quant: Percentage & Successive Discounts',
        slug: 'ssc-quant-percentage-successive-discounts',
        shortDescription: 'Master percentage calculations and successive discount formulas for CGL Tier-1.',
        fullDescription: 'Step-by-step shortcuts to solve pricing and discount equations.',
        examIds: [examsMap['SSC CGL']._id],
        phaseIds: [phasesMap['SSC CGL_Prelims']._id],
        subjectId: sscQuantSubject._id,
        tutorialType: 'article',
        articleContent: 'Successive Discounts Formula:\nFor two discounts a% and b%, equivalent single discount = (a + b - ab/100)%.\nExample: 10% and 20% successive discounts equivalent = 10 + 20 - 200/100 = 28%.',
        durationMinutes: 15,
        difficulty: 'intermediate',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] Banking Reasoning: Linear Seating Arrangement',
        slug: 'banking-reasoning-linear-seating-arrangement',
        shortDescription: 'Solve complex linear seating arrangements with north-south directions efficiently.',
        fullDescription: 'Guidelines and mock layouts for solving bank exam logical reasoning questions.',
        examIds: [examsMap['SSC CGL']._id], // mapping to SSC CGL as banking placeholder
        phaseIds: [phasesMap['SSC CGL_Prelims']._id],
        subjectId: sscReasonSubject._id,
        tutorialType: 'article',
        articleContent: '1. Read all clues first.\n2. Fix definite statements (e.g. A sits second from left end).\n3. Work through positive clues before negative constraints.',
        durationMinutes: 25,
        difficulty: 'advanced',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] Banking Quant: Data Interpretation (Pie Charts)',
        slug: 'banking-quant-data-interpretation-pie-charts',
        shortDescription: 'Shortcuts to solve ratio-based and percentage-based pie chart DIs quickly.',
        fullDescription: 'Steps to quickly solve averages and percentages in banking exams.',
        examIds: [examsMap['SSC CGL']._id],
        phaseIds: [phasesMap['SSC CGL_Prelims']._id],
        subjectId: sscQuantSubject._id,
        tutorialType: 'notes',
        durationMinutes: 15,
        difficulty: 'intermediate',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] Current Affairs: Union Budget Highlights',
        slug: 'current-affairs-union-budget-highlights',
        shortDescription: 'Key outlays, revenue sources, and capital allocations from the latest Union Budget.',
        fullDescription: 'Notes covering tax slab adjustments and infrastructure outlays.',
        examIds: [examsMap['UPSC']._id, examsMap['BPSC']._id],
        phaseIds: [phasesMap['UPSC_Prelims']._id, phasesMap['BPSC_Prelims']._id],
        subjectId: politySubject._id,
        tutorialType: 'article',
        articleContent: '1. Capital Expenditure increased to record targets.\n2. Revised Tax Slabs under the new regime.\n3. Focus on green energy and rural development outlays.',
        durationMinutes: 22,
        difficulty: 'intermediate',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] UPSC Interview: Personality Assessment Basics',
        slug: 'upsc-interview-personality-assessment-basics',
        shortDescription: 'Learn about DAF preparation, body language, and state GK mock expectations.',
        fullDescription: 'Preparation tips for personality assessment boards.',
        examIds: [examsMap['UPSC']._id],
        phaseIds: [phasesMap['UPSC_Interview']._id],
        subjectId: politySubject._id,
        tutorialType: 'notes',
        durationMinutes: 30,
        difficulty: 'advanced',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      },
      {
        title: '[Demo Content] UPSC Mains: Answer Structure Frameworks',
        slug: 'upsc-mains-answer-structure-frameworks',
        shortDescription: 'Introduction-Body-Conclusion format and diagrams implementation tips for Mains GS papers.',
        fullDescription: 'Learn how to construct elegant descriptive answers with data points.',
        examIds: [examsMap['UPSC']._id],
        phaseIds: [phasesMap['UPSC_Mains']._id],
        subjectId: politySubject._id,
        tutorialType: 'article',
        articleContent: '1. Introduction: Write definition or recent context/data.\n2. Body: Divide into multiple subheadings. Address both pros and cons.\n3. Conclusion: Optimistic, forward-looking recommendation.',
        durationMinutes: 20,
        difficulty: 'beginner',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
      }
    ];

    for (const data of tutorialsData) {
      let t = await Tutorial.findOne({ slug: data.slug });
      if (!t) {
        await Tutorial.create(data);
      }
    }
    console.log('✅ Tutorials seeded.');

    // --- 6. SEED QUESTIONS (20 items) ---
    const questionsData = [];
    
    // Add Polity Questions (10 items)
    for (let i = 1; i <= 10; i++) {
      questionsData.push({
        questionText: `[Demo Question] Indian Polity MCQ #${i}: Which Article in Indian Constitution guarantees protection of life and personal liberty?`,
        options: ['Article 19', 'Article 20', 'Article 21', 'Article 22'],
        correctAnswer: 'Article 21',
        explanation: 'Article 21 guarantees that no person shall be deprived of his life or personal liberty except according to procedure established by law.',
        examId: examsMap['UPSC']._id,
        phaseId: phasesMap['UPSC_Prelims']._id,
        subjectId: politySubject._id,
        topicId: FRTopic._id,
        subtopicId: art21Subtopic._id,
        difficulty: 'medium',
        language: 'english',
        sourceType: 'original_practice',
        sourceName: 'Demo Practice',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
        isVerified: true,
        qualityStatus: 'approved',
      });
    }

    // Add History Questions (5 items)
    for (let i = 1; i <= 5; i++) {
      questionsData.push({
        questionText: `[Demo Question] Modern History MCQ #${i}: Who was the Governor-General of India during the Revolt of 1857?`,
        options: ['Lord Dalhousie', 'Lord Canning', 'Lord Elgin', 'Lord Lytton'],
        correctAnswer: 'Lord Canning',
        explanation: 'Lord Canning was the Governor-General of India during the 1857 uprising. He later became the first Viceroy after the Government of India Act 1858.',
        examId: examsMap['UPSC']._id,
        phaseId: phasesMap['UPSC_Prelims']._id,
        subjectId: historySubject._id,
        topicId: modernHistoryTopic._id,
        difficulty: 'easy',
        language: 'english',
        sourceType: 'official_pyq',
        isPreviousYearQuestion: true,
        sourceName: 'UPSC CSE 2018',
        paperName: 'UPSC CSE Prelims Paper-1',
        sourceYear: 2018,
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
        isVerified: true,
        qualityStatus: 'approved',
      });
    }

    // Add SSC Quant Questions (5 items)
    for (let i = 1; i <= 5; i++) {
      questionsData.push({
        questionText: `[Demo Question] SSC Quant MCQ #${i}: If consecutive discounts of 10% and 20% are given on an article, what is the net discount?`,
        options: ['25%', '28%', '30%', '32%'],
        correctAnswer: '28%',
        explanation: 'Net Discount = a + b - ab/100 = 10 + 20 - 200/100 = 28%.',
        examId: examsMap['SSC CGL']._id,
        phaseId: phasesMap['SSC CGL_Prelims']._id,
        subjectId: sscQuantSubject._id,
        topicId: sscQuantTopic._id,
        difficulty: 'easy',
        language: 'english',
        sourceType: 'original_practice',
        sourceName: 'SSC Practice Series',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
        isVerified: true,
        qualityStatus: 'approved',
      });
    }

    const insertedQs = [];
    for (const qData of questionsData) {
      let q = await Question.findOne({ questionText: qData.questionText });
      if (!q) {
        q = await Question.create(qData);
      }
      insertedQs.push(q);
    }
    console.log(`✅ ${insertedQs.length} Questions seeded.`);

    // --- 7. SEED MOCK TEST ---
    let demoMockTest = await MockTest.findOne({ title: '[Demo Content] UPSC Polity Prelims Mini Mock' });
    if (!demoMockTest) {
      const qIds = insertedQs.filter(q => q.subjectId.toString() === politySubject._id.toString()).map(q => q._id);
      demoMockTest = await MockTest.create({
        title: '[Demo Content] UPSC Polity Prelims Mini Mock',
        slug: 'upsc-polity-prelims-mini-mock',
        description: 'Test your understanding on fundamental rights and articles.',
        examId: examsMap['UPSC']._id,
        phaseId: phasesMap['UPSC_Prelims']._id,
        category: 'subject_wise',
        durationMinutes: 15,
        totalQuestions: qIds.length,
        totalMarks: qIds.length * 2,
        questionSelectionMode: 'fixed',
        fixedQuestionIds: qIds,
        isPublished: true,
        status: 'published',
        createdBy: adminUser._id,
      });
      console.log('✅ Mock Test seeded.');
    }

    // --- 8. SEED PYQ PAPER ---
    let demoPYQPaper = await PYQPaper.findOne({ title: '[Demo Content] UPSC Civil Services GS 2025 (Polity Section)' });
    if (!demoPYQPaper) {
      const qIds = insertedQs.filter(q => q.subjectId.toString() === politySubject._id.toString()).map(q => q._id);
      demoPYQPaper = await PYQPaper.create({
        title: '[Demo Content] UPSC Civil Services GS 2025 (Polity Section)',
        slug: 'upsc-civil-services-gs-2025-polity-section',
        examId: examsMap['UPSC']._id,
        phaseId: phasesMap['UPSC_Prelims']._id,
        year: 2025,
        paperName: 'General Studies Paper-1',
        paperType: 'prelims',
        language: 'english',
        durationMinutes: 20,
        totalQuestions: qIds.length,
        totalMarks: qIds.length * 2,
        officialSourceName: 'UPSC Official Site',
        officialSourceUrl: 'https://upsc.gov.in',
        sourceVerified: true,
        questionIds: qIds,
        isPublished: true,
        status: 'published',
        createdBy: adminUser._id,
      });
      console.log('✅ PYQ Paper seeded.');
    }

    // --- 9. SEED CURRENT AFFAIRS SOURCE & PACK ---
    let demoSource = await CurrentAffairsSource.findOne({ publisherName: 'The Hindu Editorial Summary' });
    if (!demoSource) {
      demoSource = await CurrentAffairsSource.create({
        title: 'NJAC Controversies & Judicial Appointments June 2026',
        publisherName: 'The Hindu Editorial Summary',
        sourceCategory: 'original_summary',
        reliabilityLevel: 'high',
        summary: 'Summary notes covering judicial appointments and NJAC controversies in June 2026.',
        isVerified: true,
        createdBy: adminUser._id,
      });
      console.log('✅ CA Source seeded.');
    }

    let demoCAPack = await CurrentAffairsPack.findOne({ title: '[Demo Content] June 2026 Monthly Pack' });
    if (!demoCAPack) {
      // Create a CA question
      const caQ = await Question.create({
        questionText: '[Demo Question] Current Affairs June 2026: Who has been appointed as the new Chief Justice of India?',
        options: ['Justice A', 'Justice B', 'Justice C', 'Justice D'],
        correctAnswer: 'Justice A',
        explanation: 'Justice A is appointed as the new CJI in recent news articles.',
        examId: examsMap['UPSC']._id,
        phaseId: phasesMap['UPSC_Prelims']._id,
        subjectId: politySubject._id,
        topicId: caTopic._id,
        difficulty: 'medium',
        language: 'english',
        sourceType: 'current_affairs',
        currentAffairsMonth: 6,
        currentAffairsYear: 2026,
        sourceName: 'The Hindu',
        sourceReliability: 'high',
        currentAffairsCategory: 'judiciary',
        createdBy: adminUser._id,
        status: 'published',
        isPublished: true,
        sourceVerified: true,
        qualityStatus: 'approved',
      });

      demoCAPack = await CurrentAffairsPack.create({
        title: '[Demo Content] June 2026 Monthly Pack',
        month: 6,
        year: 2026,
        language: 'english',
        examIds: [examsMap['UPSC']._id],
        categories: ['judiciary'],
        sourceIds: [demoSource._id],
        questionIds: [caQ._id],
        totalQuestions: 1,
        isPublished: true,
        status: 'published',
        createdBy: adminUser._id,
      });
      console.log('✅ Current Affairs Pack seeded.');
    }

    console.log('\n============================================================');
    console.log('🎉 TargetRank Demo Seeding Completed successfully!');
    console.log('============================================================');
    console.log(`ADMIN LOGIN:    ${adminEmail}  / ${adminPassword}`);
    console.log(`MENTOR LOGIN:   ${mentorEmail} / ${mentorPassword}`);
    console.log(`ASPIRANT LOGIN: ${studentEmail} / ${studentPassword}`);
    console.log('============================================================\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding demo database:', error);
    process.exit(1);
  }
};

run();
