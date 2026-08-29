import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import MockTest from '../models/MockTest.js';
import PYQPaper from '../models/PYQPaper.js';
import User from '../models/User.js';

dotenv.config();

const isReset = process.argv.includes('--reset');

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
    console.log(`🔌 Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected.');

    if (isReset) {
      console.log('🔄 Reset option specified. Clearing questions, mock tests and PYQ papers...');
      await Question.deleteMany({});
      await MockTest.deleteMany({});
      await PYQPaper.deleteMany({});
      console.log('✅ Collections cleared.');
    }

    // Ensure we have admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Seed Admin',
        email: 'admin@targetrank.com',
        password: 'Test@123',
        role: 'admin',
        active: true,
      });
    }

    // Mapping maps
    const exams = await Exam.find({}).lean();
    const examMap = new Map(exams.map(e => [e.slug, e]));

    const phases = await ExamPhase.find({}).lean();
    const phaseMap = new Map(phases.map(p => [`${p.examId}_${p.slug}`, p]));

    const subjects = await Subject.find({}).lean();
    const subjectMap = new Map(subjects.map(s => [`${s.phaseId}_${s.slug}`, s]));

    const topics = await Topic.find({}).lean();
    const topicMap = new Map(topics.map(t => [`${t.subjectId}_${t.slug}`, t]));

    const getRef = (examSlug, phaseSlug, subjectSlug, topicSlug) => {
      const exam = examMap.get(examSlug);
      if (!exam) return null;
      const phase = phaseMap.get(`${exam._id}_${phaseSlug}`);
      if (!phase) return null;
      const subject = subjectMap.get(`${phase._id}_${subjectSlug}`);
      if (!subject) return null;
      const topic = topicMap.get(`${subject._id}_${topicSlug}`);
      if (!topic) return null;

      return {
        examId: exam._id,
        phaseId: phase._id,
        subjectId: subject._id,
        topicId: topic._id
      };
    };

    console.log('🌱 Generating demo questions...');

    const createQuestionsBatch = async (ref, count, prefix, tags, extra = {}) => {
      if (!ref) {
        console.error(`Missing references for batch prefix: ${prefix}`);
        return [];
      }
      const list = [];
      for (let i = 1; i <= count; i++) {
        const questionText = `${prefix} Demo Question ${i}: This is a conceptual practice question detailing core topics of the syllabus for testing.`;
        const norm = questionText.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
        const hash = `${norm}_${ref.examId}_${ref.subjectId}_${ref.topicId}_2026`;

        // Check if exists
        const exists = await Question.findOne({ duplicateHash: hash });
        if (exists) {
          list.push(exists);
          continue;
        }

        const q = await Question.create({
          examId: ref.examId,
          phaseId: ref.phaseId,
          subjectId: ref.subjectId,
          topicId: ref.topicId,
          questionType: 'mcq',
          questionText,
          options: [`Option A for ${prefix} Q${i}`, `Option B for ${prefix} Q${i}`, `Option C for ${prefix} Q${i}`, `Option D for ${prefix} Q${i}`],
          correctAnswer: `Option A for ${prefix} Q${i}`,
          explanation: `Detailed conceptual explanation for ${prefix} Question ${i}. This describes why Option A is the correct answer and how it maps to exam requirements.`,
          difficulty: i % 3 === 1 ? 'easy' : (i % 3 === 2 ? 'medium' : 'hard'),
          marks: 2,
          negativeMarks: 0.66,
          language: 'english',
          sourceType: 'original_practice',
          sourceName: 'TargetRank original content',
          duplicateHash: hash,
          isPublished: true,
          isVerified: true,
          qualityStatus: 'approved',
          createdBy: admin._id,
          tags: tags || [],
          importanceLevel: i % 4 === 0 ? 'very_important' : (i % 4 === 1 ? 'important' : 'normal'),
          ...extra
        });
        list.push(q);
      }
      return list;
    };

    const allCreatedQuestions = [];

    // 1. UPSC Polity (10)
    const upscPolity = getRef('upsc-cse', 'upsc-prelims-gs-paper-1', 'polity-and-governance', 'constitution');
    const upscPolityQs = await createQuestionsBatch(upscPolity, 10, 'UPSC Polity', ['Constitution', 'Polity']);
    allCreatedQuestions.push(...upscPolityQs);

    // 2. UPSC History (10)
    const upscHist = getRef('upsc-cse', 'upsc-prelims-gs-paper-1', 'history-and-culture', 'ancient-india');
    const upscHistQs = await createQuestionsBatch(upscHist, 10, 'UPSC History', ['Ancient History', 'History']);
    allCreatedQuestions.push(...upscHistQs);

    // 3. UPSC Geography (10)
    const upscGeo = getRef('upsc-cse', 'upsc-prelims-gs-paper-1', 'geography', 'indian-geography');
    const upscGeoQs = await createQuestionsBatch(upscGeo, 10, 'UPSC Geography', ['Indian Geography', 'Geography']);
    allCreatedQuestions.push(...upscGeoQs);

    // 4. UPSC Economy (10)
    const upscEcon = getRef('upsc-cse', 'upsc-prelims-gs-paper-1', 'economy', 'basic-economics');
    const upscEconQs = await createQuestionsBatch(upscEcon, 10, 'UPSC Economy', ['Basic Economics', 'Economy']);
    allCreatedQuestions.push(...upscEconQs);

    // 5. BPSC Bihar GK (10)
    const bpscGK = getRef('bpsc', 'bpsc-prelims', 'bihar-gk', 'bihar-history');
    const bpscGKQs = await createQuestionsBatch(bpscGK, 10, 'BPSC Bihar GK', ['Bihar GK', 'History']);
    allCreatedQuestions.push(...bpscGKQs);

    // 6. JPSC Jharkhand GK (10)
    const jpscGK = getRef('jpsc', 'jpsc-prelims', 'jharkhand-gk', 'jharkhand-history');
    const jpscGKQs = await createQuestionsBatch(jpscGK, 10, 'JPSC Jharkhand GK', ['Jharkhand GK', 'History']);
    allCreatedQuestions.push(...jpscGKQs);

    // 7. UPPSC Uttar Pradesh GK (10)
    const uppscGK = getRef('uppsc', 'uppsc-prelims', 'uttar-pradesh-gk', 'uttar-pradesh-history');
    const uppscGKQs = await createQuestionsBatch(uppscGK, 10, 'UPPSC UP GK', ['UP GK', 'History']);
    allCreatedQuestions.push(...uppscGKQs);

    // 8. SSC Reasoning (10)
    const sscReason = getRef('ssc-cgl', 'ssc-cgl-tier-i', 'general-intelligence-and-reasoning', 'analogy');
    const sscReasonQs = await createQuestionsBatch(sscReason, 10, 'SSC Reasoning', ['Reasoning', 'Analogy']);
    allCreatedQuestions.push(...sscReasonQs);

    // 9. SSC Quant (10)
    const sscQuant = getRef('ssc-cgl', 'ssc-cgl-tier-i', 'quantitative-aptitude', 'percentage');
    const sscQuantQs = await createQuestionsBatch(sscQuant, 10, 'SSC Quant', ['Aptitude', 'Percentage']);
    allCreatedQuestions.push(...sscQuantQs);

    // 10. Banking Reasoning (10)
    const bankReason = getRef('banking-exams', 'banking-prelims', 'reasoning-ability', 'general-reasoning-ability-practice');
    const bankReasonQs = await createQuestionsBatch(bankReason, 10, 'Banking Reasoning', ['Reasoning', 'Puzzles']);
    allCreatedQuestions.push(...bankReasonQs);

    // 11. Banking Quant (10)
    const bankQuant = getRef('banking-exams', 'banking-prelims', 'quantitative-aptitude', 'general-quantitative-aptitude-practice');
    const bankQuantQs = await createQuestionsBatch(bankQuant, 10, 'Banking Quant', ['Aptitude', 'Quant']);
    allCreatedQuestions.push(...bankQuantQs);

    // 12. General Current Affairs (10)
    const genCA = getRef('general-gkgs-practice', 'gkgs-practice-phase', 'current-affairs', 'general-current-affairs-practice');
    const genCAQs = await createQuestionsBatch(genCA, 10, 'General Current Affairs', ['Current Affairs', 'GK'], {
      sourceType: 'current_affairs',
      currentAffairsMonth: 7,
      currentAffairsYear: 2026,
      currentAffairsCategory: 'national',
      sourceReliability: 'official',
      sourceVerified: true
    });
    allCreatedQuestions.push(...genCAQs);

    console.log(`✅ ${allCreatedQuestions.length} demo questions verified/created.`);

    // ==========================================
    // SEED MOCK TESTS
    // ==========================================
    console.log('🌱 Generating demo mock tests...');
    
    // A. UPSC Mock Test (20 questions)
    const upscExam = examMap.get('upsc-cse');
    const upscPhase = phaseMap.get(`${upscExam._id}_upsc-prelims-gs-paper-1`);
    
    // Select 20 UPSC questions (Polity + History + Geography + Economy)
    const upscSelectedQs = allCreatedQuestions.filter(q => q.examId.toString() === upscExam._id.toString()).slice(0, 20);
    const upscSelectedIds = upscSelectedQs.map(q => q._id);

    let upscMock = await MockTest.findOne({ slug: 'demo-upsc-prelims-mock-test' });
    if (!upscMock) {
      upscMock = await MockTest.create({
        title: 'Demo UPSC Prelims GS Mock Test',
        slug: 'demo-upsc-prelims-mock-test',
        description: 'Comprehensive test to practice Indian Polity, History, and Geography concepts.',
        examId: upscExam._id,
        phaseId: upscPhase._id,
        category: 'full_length',
        instructions: 'Attempt all questions. Correct answer adds 2 marks. Incorrect answer deducts 0.66 marks.',
        language: 'english',
        durationMinutes: 30,
        totalQuestions: upscSelectedIds.length,
        totalMarks: upscSelectedIds.length * 2,
        passingMarks: 16,
        isPublished: true,
        createdBy: admin._id,
        status: 'published',
        questionSelectionMode: 'fixed',
        fixedQuestionIds: upscSelectedIds
      });
      console.log('✅ UPSC Mock Test seeded.');
    }

    // B. SSC CGL Mock Test (20 questions)
    const sscExam = examMap.get('ssc-cgl');
    const sscPhase = phaseMap.get(`${sscExam._id}_ssc-cgl-tier-i`);

    const sscSelectedQs = allCreatedQuestions.filter(q => q.examId.toString() === sscExam._id.toString()).slice(0, 20);
    const sscSelectedIds = sscSelectedQs.map(q => q._id);

    let sscMock = await MockTest.findOne({ slug: 'demo-ssc-cgl-tier1-mock' });
    if (!sscMock) {
      sscMock = await MockTest.create({
        title: 'Demo SSC CGL Tier I Practice Test',
        slug: 'demo-ssc-cgl-tier1-mock',
        description: 'Standard practice set containing logical reasoning and quantitative aptitude.',
        examId: sscExam._id,
        phaseId: sscPhase._id,
        category: 'full_length',
        instructions: 'Standard SSC pattern. 2 marks per correct, -0.5 per wrong.',
        language: 'english',
        durationMinutes: 20,
        totalQuestions: sscSelectedIds.length,
        totalMarks: sscSelectedIds.length * 2,
        passingMarks: 14,
        isPublished: true,
        createdBy: admin._id,
        status: 'published',
        questionSelectionMode: 'fixed',
        fixedQuestionIds: sscSelectedIds
      });
      console.log('✅ SSC CGL Mock Test seeded.');
    }

    // ==========================================
    // SEED PYQ PAPER (BPSC PYQ Style)
    // ==========================================
    console.log('🌱 Generating demo BPSC PYQ Practice Paper...');
    const bpscExam = examMap.get('bpsc');
    const bpscPhase = phaseMap.get(`${bpscExam._id}_bpsc-prelims`);

    const bpscSelectedQs = allCreatedQuestions.filter(q => q.examId.toString() === bpscExam._id.toString()).slice(0, 10);
    const bpscSelectedIds = bpscSelectedQs.map(q => q._id);

    // Update BPSC question source details to make them PYQ-like
    for (const q of bpscSelectedQs) {
      q.sourceType = 'official_pyq';
      q.isPreviousYearQuestion = true;
      q.sourceYear = 2024;
      q.paperName = '69th BPSC Combined Competitive Prelims';
      q.questionNumberInPaper = Math.floor(Math.random() * 150) + 1;
      await q.save();
    }

    let bpscPyqPaper = await PYQPaper.findOne({ slug: 'demo-bpsc-prelims-pyq-paper' });
    if (!bpscPyqPaper) {
      bpscPyqPaper = await PYQPaper.create({
        title: 'Demo BPSC Prelims PYQ Practice Set',
        slug: 'demo-bpsc-prelims-pyq-paper',
        examId: bpscExam._id,
        phaseId: bpscPhase._id,
        examName: 'BPSC PCS',
        year: 2024,
        paperName: 'Demo / Not Official PYQ',
        paperType: 'prelims',
        language: 'english',
        durationMinutes: 15,
        totalQuestions: bpscSelectedIds.length,
        totalMarks: bpscSelectedIds.length * 2,
        negativeMarkingEnabled: true,
        defaultNegativeMarks: 0.66,
        officialSourceName: 'Bihar Public Service Commission',
        officialSourceUrl: 'https://bpsc.bih.nic.in',
        sourceVerified: true,
        questionIds: bpscSelectedIds,
        instructions: 'BPSC prelims practice simulation set.',
        isPublished: true,
        status: 'published',
        createdBy: admin._id
      });
      console.log('✅ BPSC Demo PYQ Practice Paper seeded.');
    }

    console.log('============================================================');
    console.log('🎉 TargetRank Question Practice Demo Seeding Completed successfully!');
    console.log('============================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo questions:', error);
    process.exit(1);
  }
};

run();
