import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to database.');

    // 1. Fetch or create an Admin User to attach as createdBy
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Creating a default seed admin...');
      admin = await User.create({
        name: 'Seed Admin',
        email: 'admin@targetrank.com',
        password: 'admin123',
        role: 'admin',
        active: true,
      });
      console.log('Default seed admin created.');
    }

    // 2. Clear old data
    console.log('Clearing old Exam, Phase, Subject, and Topic tables...');
    await Exam.deleteMany({});
    await ExamPhase.deleteMany({});
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    console.log('Tables cleared.');

    // ─── 3. SEED EXAMS ───

    // A. UPSC CSE
    const upsc = await Exam.create({
      title: 'UPSC Civil Services Examination',
      slug: 'upsc-cse',
      shortDescription: 'The premier exam to recruit officers into IAS, IPS, IFS, and other allied central services.',
      fullDescription: 'The Civil Services Examination (CSE) is a national competitive examination in India conducted by the Union Public Service Commission for recruitment to various Civil Services of the Government of India, including the Indian Administrative Service (IAS), Indian Foreign Service (IFS), and Indian Police Service (IPS).',
      conductingBody: 'Union Public Service Commission (UPSC)',
      eligibility: 'Graduate in any discipline. Age limit: 21 to 32 years (Relaxations apply).',
      examPattern: 'Three stages: Prelims (Objective, 2 Papers), Mains (Written Descriptive, 9 Papers), and Personality Test (Interview).',
      importantDates: [
        { title: 'Notification Release', dateString: 'February 2027' },
        { title: 'Preliminary Exam', dateString: 'May 2027' },
        { title: 'Mains Exam', dateString: 'September 2027' }
      ],
      createdBy: admin._id,
    });

    // B. BPSC
    const bpsc = await Exam.create({
      title: 'BPSC State PCS Combined Competitive Exam',
      slug: 'bpsc-pcs',
      shortDescription: 'State-level civil services exam conducted for recruitment into Bihar administrative posts.',
      fullDescription: 'The Bihar Public Service Commission (BPSC) conducts the Combined Competitive Examination to recruit candidates for various posts such as Sub Divisional Officer, Deputy Superintendent of Police, Block Development Officer, and other administrative roles in Bihar.',
      conductingBody: 'Bihar Public Service Commission (BPSC)',
      eligibility: 'Graduate from a recognized university. General Age Limit: 21 to 37 years.',
      examPattern: 'Three stages: Preliminary Exam (Descriptive MCQ, 150 Marks), Main Exam (Written Descriptive, 4 Papers), and Interview (120 Marks).',
      importantDates: [
        { title: 'Notification Release', dateString: 'June 2027' },
        { title: 'Preliminary Exam', dateString: 'September 2027' }
      ],
      createdBy: admin._id,
    });

    // C. UPPSC
    const uppsc = await Exam.create({
      title: 'UPPSC State PCS Provincial Civil Services',
      slug: 'uppsc-pcs',
      shortDescription: 'Recruits officers to Uttar Pradesh state civil administration, police force, and allied services.',
      fullDescription: 'The Uttar Pradesh Public Service Commission (UPPSC) conducts the Combined State/Upper Subordinate Services Exam, commonly called State PCS, to recruit candidates for state government offices in executive and policing capacities.',
      conductingBody: 'Uttar Pradesh Public Service Commission (UPPSC)',
      eligibility: 'Bachelor Degree. Age: 21 to 40 years.',
      examPattern: 'Prelims (2 Papers, MCQ), Mains (Descriptive, 8 Papers), and Interview (100 Marks).',
      importantDates: [
        { title: 'Notification Release', dateString: 'January 2027' },
        { title: 'Preliminary Exam', dateString: 'April 2027' }
      ],
      createdBy: admin._id,
    });

    // D. SSC CGL
    const ssc = await Exam.create({
      title: 'SSC CGL Combined Graduate Level',
      slug: 'ssc-cgl',
      shortDescription: 'Recruits staff for various posts in ministries, departments and organizations of the Government of India.',
      fullDescription: 'The Staff Selection Commission conducts the Combined Graduate Level (CGL) Exam for recruitment of Grade B and C category posts in government ministries and inspectorates.',
      conductingBody: 'Staff Selection Commission (SSC)',
      eligibility: 'Bachelor Degree. Age limit varies between 18 to 32 years.',
      examPattern: 'Tier I (Objective MCQ, Computer-based) and Tier II (Objective MCQ + Descriptive/Skill modules).',
      importantDates: [
        { title: 'Notification Release', dateString: 'March 2027' },
        { title: 'Tier I Exam', dateString: 'June 2027' }
      ],
      createdBy: admin._id,
    });

    // E. Banking
    const banking = await Exam.create({
      title: 'IBPS / SBI PO Combined Banking Prep',
      slug: 'banking-po',
      shortDescription: 'Comprehensive syllabus covering Probationary Officer (PO) and Clerk entry points in nationalized banks.',
      fullDescription: 'Prepares aspirants for national banking exams including SBI PO, IBPS PO, and regional rural bank officer categories focusing on rapid quantitative, logical, and language skills.',
      conductingBody: 'Institute of Banking Personnel Selection / State Bank of India',
      eligibility: 'Graduate in any discipline. Age: 20 to 30 years.',
      examPattern: 'Preliminary Exam (Speed Objective), Mains Exam (Objective + Descriptive), and Group Discussion/Interview.',
      importantDates: [
        { title: 'SBI PO Notification', dateString: 'August 2027' },
        { title: 'IBPS PO Prelims', dateString: 'October 2027' }
      ],
      createdBy: admin._id,
    });

    console.log('Exams seeded.');

    // ────────────────────────────────────────────────────────
    // ─── 4. SEED UPSC SYLLABUS ───
    console.log('Seeding UPSC phases, subjects, and topics...');
    
    // Phases
    const upscP1 = await ExamPhase.create({ examId: upsc._id, title: 'Preliminary Examination', description: 'Objective screening phase consisting of GS I and CSAT', order: 1 });
    const upscP2 = await ExamPhase.create({ examId: upsc._id, title: 'Main Examination', description: 'Written subjective descriptive papers testing critical thinking', order: 2 });
    const upscP3 = await ExamPhase.create({ examId: upsc._id, title: 'Personality Test', description: 'Interactive board interview evaluating officer suitability', order: 3 });

    // Prelims Subjects
    const upscS1 = await Subject.create({ examId: upsc._id, phaseId: upscP1._id, title: 'General Studies I', description: 'History, geography, polity, economics, environment, current events', order: 1 });
    const upscS2 = await Subject.create({ examId: upsc._id, phaseId: upscP1._id, title: 'CSAT (GS Paper II)', description: 'Logical reasoning, math, reading comprehension', order: 2 });

    // Mains Subjects
    const upscS3 = await Subject.create({ examId: upsc._id, phaseId: upscP2._id, title: 'Indian Polity & Constitution', description: 'Governance, Constitution, Polity, Social Justice and International Relations', order: 1 });
    const upscS4 = await Subject.create({ examId: upsc._id, phaseId: upscP2._id, title: 'History & Culture', description: 'Indian culture, modern history, world history, and post-independence history', order: 2 });

    // Topics: GS I (Prelims)
    await Topic.create({
      examId: upsc._id,
      phaseId: upscP1._id,
      subjectId: upscS1._id,
      title: 'Indian Polity & Governance',
      description: 'Constitution, Political System, Panchayati Raj, Public Policy, Rights Issues.',
      estimatedStudyHours: 45,
      order: 1,
      subtopics: ['Preamble & Features', 'Fundamental Rights & Duties', 'Directive Principles of State Policy', 'Panchayati Raj Institution', 'Judiciary & Union Parliament']
    });

    await Topic.create({
      examId: upsc._id,
      phaseId: upscP1._id,
      subjectId: upscS1._id,
      title: 'Physical Geography of India',
      description: 'Detailed geographical structures, rivers, mountains, and climate zones.',
      estimatedStudyHours: 35,
      order: 2,
      subtopics: ['Himalayas & Northern Plains', 'River Systems of India', 'Indian Monsoons & Climate', 'Forests & Soils', 'Mineral Resources Distribution']
    });

    // Topics: CSAT (Prelims)
    await Topic.create({
      examId: upsc._id,
      phaseId: upscP1._id,
      subjectId: upscS2._id,
      title: 'Basic Numeracy',
      description: 'Numbers and their relations, orders of magnitude, etc. (Class X level)',
      estimatedStudyHours: 30,
      order: 1,
      subtopics: ['Number System & HCF/LCM', 'Percentages & Profit/Loss', 'Ratio, Proportion & Averages', 'Time, Speed and Distance', 'Permutations & Combinations']
    });

    // Topics: Indian Polity (Mains)
    await Topic.create({
      examId: upsc._id,
      phaseId: upscP2._id,
      subjectId: upscS3._id,
      title: 'Structure & Functions of Judiciary',
      description: 'Supreme Court, High Courts, Judicial Review, Judicial Activism, and Public Interest Litigation.',
      estimatedStudyHours: 25,
      order: 1,
      subtopics: ['Appellate Jurisdiction', 'Judicial Review Doctrine', 'Collegium System Controversy', 'Fast Track Courts & Gram Nyayalayas']
    });


    // ────────────────────────────────────────────────────────
    // ─── 5. SEED BPSC SYLLABUS ───
    console.log('Seeding BPSC phases, subjects, and topics...');
    
    const bpscP1 = await ExamPhase.create({ examId: bpsc._id, title: 'Preliminary Exam', description: 'Single objective paper of 150 marks', order: 1 });
    const bpscP2 = await ExamPhase.create({ examId: bpsc._id, title: 'Main Exam', description: 'Written descriptive papers', order: 2 });

    const bpscS1 = await Subject.create({ examId: bpsc._id, phaseId: bpscP1._id, title: 'Bihar Special', description: 'History, geography, economy, and politics of Bihar', order: 1 });
    const bpscS2 = await Subject.create({ examId: bpsc._id, phaseId: bpscP1._id, title: 'General Mental Ability', description: 'Basic mathematics and logical questions', order: 2 });

    // Topics
    await Topic.create({
      examId: bpsc._id,
      phaseId: bpscP1._id,
      subjectId: bpscS1._id,
      title: 'Bihar History & Freedom Struggle',
      description: 'Role of Bihar in the revolt of 1857, Quit India movement, Champaran Satyagraha.',
      estimatedStudyHours: 20,
      order: 1,
      subtopics: ['Kunwar Singh & Revolt of 1857', 'Champaran Satyagraha (1917)', 'Bihar Socialist Party', 'Ancient Empires: Maurya & Gupta in Bihar']
    });

    await Topic.create({
      examId: bpsc._id,
      phaseId: bpscP1._id,
      subjectId: bpscS1._id,
      title: 'Bihar Geography & Climate',
      description: 'Physical geography, rivers, soils, forests, and agricultural zones of Bihar.',
      estimatedStudyHours: 15,
      order: 2,
      subtopics: ['Ganga River & Tributaries in Bihar', 'Flood and Drought Issues', 'Soils of North & South Bihar', 'Mineral Belts in Southern Bihar']
    });


    // ────────────────────────────────────────────────────────
    // ─── 6. SEED UPPSC SYLLABUS ───
    console.log('Seeding UPPSC phases, subjects, and topics...');
    
    const uppscP1 = await ExamPhase.create({ examId: uppsc._id, title: 'Preliminary Exam', description: 'Paper I (GS) and Paper II (CSAT)', order: 1 });
    const uppscP2 = await ExamPhase.create({ examId: uppsc._id, title: 'Main Exam', description: 'Descriptive Papers', order: 2 });

    const uppscS1 = await Subject.create({ examId: uppsc._id, phaseId: uppscP1._id, title: 'Uttar Pradesh Special Studies', description: 'Detailed knowledge about UP state', order: 1 });

    await Topic.create({
      examId: uppsc._id,
      phaseId: uppscP1._id,
      subjectId: uppscS1._id,
      title: 'UP History, Culture and Heritage',
      description: 'Ancient historical sites in UP, Sufi and Bhakti movements, art forms.',
      estimatedStudyHours: 25,
      order: 1,
      subtopics: ['Ayodhya & Kushinagar Archeology', 'Mughal Architecture in Agra', 'Kathak Classical Dance in UP', 'Folk Music: Kajri & Alha']
    });


    // ────────────────────────────────────────────────────────
    // ─── 7. SEED SSC CGL SYLLABUS ───
    console.log('Seeding SSC CGL phases, subjects, and topics...');
    
    const sscP1 = await ExamPhase.create({ examId: ssc._id, title: 'Tier I Exam', description: 'Online computer-based objective screening', order: 1 });
    const sscP2 = await ExamPhase.create({ examId: ssc._id, title: 'Tier II Exam', description: 'Detailed computer exam with advanced math & language sections', order: 2 });

    const sscS1 = await Subject.create({ examId: ssc._id, phaseId: sscP1._id, title: 'Quantitative Aptitude', description: 'Mathematical and calculation aptitude', order: 1 });
    const sscS2 = await Subject.create({ examId: ssc._id, phaseId: sscP1._id, title: 'Reasoning & Intelligence', description: 'Verbal and non-verbal reasoning skills', order: 2 });

    await Topic.create({
      examId: ssc._id,
      phaseId: sscP1._id,
      subjectId: sscS1._id,
      title: 'Arithmetic Operations',
      description: 'General mathematical calculations, ratios, percentages.',
      estimatedStudyHours: 40,
      order: 1,
      subtopics: ['Profit, Loss and Discount', 'Simple & Compound Interest', 'Ratio and Partnership', 'Time, Work & Wages', 'Pipes & Cisterns']
    });

    await Topic.create({
      examId: ssc._id,
      phaseId: sscP1._id,
      subjectId: sscS1._id,
      title: 'Algebra & Geometry',
      description: 'Basic algebraic identities, elementary surds, triangles and circles.',
      estimatedStudyHours: 35,
      order: 2,
      subtopics: ['Linear Equations in Two Variables', 'Congruence & Similarity of Triangles', 'Chords and Tangents of Circles', 'Heights and Distances']
    });


    // ────────────────────────────────────────────────────────
    // ─── 8. SEED BANKING SYLLABUS ───
    console.log('Seeding Banking phases, subjects, and topics...');
    
    const bankP1 = await ExamPhase.create({ examId: banking._id, title: 'Prelims Exam', description: 'Time-bound speed analysis test', order: 1 });
    const bankP2 = await ExamPhase.create({ examId: banking._id, title: 'Mains Exam', description: 'Advanced sections + descriptive writing', order: 2 });

    const bankS1 = await Subject.create({ examId: banking._id, phaseId: bankP1._id, title: 'Numerical Ability', description: 'Data interpretation and calculations', order: 1 });
    const bankS2 = await Subject.create({ examId: banking._id, phaseId: bankP2._id, title: 'Banking Awareness', description: 'Financial knowledge, RBI guidelines', order: 2 });

    await Topic.create({
      examId: banking._id,
      phaseId: bankP1._id,
      subjectId: bankS1._id,
      title: 'Simplification & Estimation',
      description: 'BODMAS rules, approximate values, square roots.',
      estimatedStudyHours: 12,
      order: 1,
      subtopics: ['BODMAS Priority Rules', 'Percentage Estimations', 'Surds and Indices Calculations', 'Quadratic Equations Speed Tricks']
    });

    await Topic.create({
      examId: banking._id,
      phaseId: bankP2._id,
      subjectId: bankS2._id,
      title: 'Reserve Bank of India & Banking History',
      description: 'Syllabus covering history of banks, nationalization, RBI functions.',
      estimatedStudyHours: 20,
      order: 1,
      subtopics: ['Establishment & Nationalization of Banks', 'Monetary Policy Instruments (Repo, CRR)', 'Inflation Control & RBI Functions', 'Payment Gateways & Digital Reforms']
    });

    console.log('Data Seeding Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during data seeding:', error);
    process.exit(1);
  }
};

seedData();
