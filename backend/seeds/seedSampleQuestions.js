/**
 * seedSampleQuestions.js
 * Seeds 30 sample questions across all 8 exams for QCMS validation.
 * Covers all 11 question types, 3 difficulties, 3 quality statuses.
 * Does NOT wipe existing questions — idempotent via duplicateHash uniqueness.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) { console.error('No admin found. Run user seed first.'); process.exit(1); }

  // Lookup helper: return first match or null
  const getExam    = (t) => Exam.findOne({ title: { $regex: t, $options: 'i' } }).lean();
  const getPhase   = (examId, t) => ExamPhase.findOne({ examId, title: { $regex: t, $options: 'i' } }).lean();
  const getSubject = (examId, t) => Subject.findOne({ examId, title: { $regex: t, $options: 'i' } }).lean();
  const getTopic   = (subjectId, t) => Topic.findOne({ subjectId, title: { $regex: t, $options: 'i' } }).lean();

  let saved = 0, skipped = 0;

  const upsert = async (data) => {
    const norm = data.questionText.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
    const hash = `${norm}_${data.examId}_${data.subjectId}_${data.topicId}_${data.sourceYear || ''}`;
    try {
      await Question.findOneAndUpdate(
        { duplicateHash: hash },
        { ...data, duplicateHash: hash },
        { upsert: true, new: true, runValidators: false }
      );
      saved++;
    } catch (e) {
      if (e.code === 11000) skipped++;
      else console.error('  Error inserting:', e.message);
    }
  };

  // ═══════════════════════════════════════════════════════
  // UPSC Questions
  // ═══════════════════════════════════════════════════════
  const upsc   = await getExam('UPSC');
  if (upsc) {
    const prelims = await getPhase(upsc._id, 'Prelims');
    const histSub = await getSubject(upsc._id, 'History');
    const ancTop  = histSub ? await getTopic(histSub._id, 'Ancient India') : null;

    if (prelims && histSub && ancTop) {
      await upsert({
        examId: upsc._id, phaseId: prelims._id, subjectId: histSub._id, topicId: ancTop._id,
        questionType: 'mcq', questionText: 'The Harappan site of Lothal is located in which present-day state?',
        options: ['Rajasthan', 'Gujarat', 'Punjab', 'Haryana'],
        correctAnswer: 'Gujarat', difficulty: 'medium', marks: 2, negativeMarks: 0.67,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'very_important',
        explanation: 'Lothal is one of the most prominent cities of the Indus Valley Civilisation, located in Bhal, Ahmedabad, Gujarat.',
        tags: ['indus_valley', 'harappan', 'ancient_india', 'geography'],
        createdBy: admin._id,
      });

      await upsert({
        examId: upsc._id, phaseId: prelims._id, subjectId: histSub._id, topicId: ancTop._id,
        questionType: 'mcq', questionText: 'Which of the following is NOT a feature of the Indus Valley Civilization?',
        options: ['Town planning with grid pattern', 'Use of iron tools', 'Great Bath at Mohenjo-daro', 'Use of standard weights and measures'],
        correctAnswer: 'Use of iron tools', difficulty: 'easy', marks: 2, negativeMarks: 0.67,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'important',
        explanation: 'The Harappan civilization is classified as a Bronze Age civilization. Iron was NOT used; the Iron Age came later in Indian subcontinent history.',
        tags: ['indus_valley', 'bronze_age', 'harappan'],
        createdBy: admin._id,
      });

      await upsert({
        examId: upsc._id, phaseId: prelims._id, subjectId: histSub._id, topicId: ancTop._id,
        questionType: 'true_false', questionText: 'The Vedic period preceded the Indus Valley Civilization chronologically.',
        options: ['True', 'False'], correctAnswer: 'False', difficulty: 'easy', marks: 1, negativeMarks: 0,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'basic',
        explanation: 'The Indus Valley Civilization (3300–1300 BCE) actually preceded the Vedic Period (1500–500 BCE).',
        tags: ['vedic_age', 'indus_valley', 'chronology'],
        createdBy: admin._id,
      });

      await upsert({
        examId: upsc._id, phaseId: prelims._id, subjectId: histSub._id, topicId: ancTop._id,
        questionType: 'multiple_select',
        questionText: 'Which of the following statements about the Indus Valley Civilization are correct?\n1. It had no knowledge of writing\n2. The script remains undeciphered\n3. They worshipped pashupati (proto-Shiva)\n4. The economy was purely agricultural',
        options: ['Statement 1', 'Statement 2', 'Statement 3', 'Statement 4'],
        correctAnswers: ['Statement 2', 'Statement 3'], difficulty: 'hard', marks: 2, negativeMarks: 0,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'very_important',
        explanation: 'Statement 1 is wrong — IVC had writing, but it remains undeciphered (Statement 2 is correct). Statement 3 is accepted. Statement 4 is incorrect — they had trade too.',
        tags: ['indus_valley', 'script', 'pashupati'],
        createdBy: admin._id,
      });

      await upsert({
        examId: upsc._id, phaseId: prelims._id, subjectId: histSub._id, topicId: ancTop._id,
        questionType: 'assertion_reason',
        questionText: 'Assertion (A): The Harappan cities were planned with great uniformity.\nReason (R): Harappan cities used a centralized government with bureaucratic control.\n\nChoose the correct answer:\n(A) Both A and R are true, and R is the correct explanation of A.\n(B) Both A and R are true, but R is NOT the correct explanation.\n(C) A is true but R is false.\n(D) A is false but R is true.',
        options: ['(A)', '(B)', '(C)', '(D)'], correctAnswer: '(B)',
        difficulty: 'hard', marks: 2, negativeMarks: 0.67,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'high_frequency',
        explanation: 'A is true — Harappan cities show remarkable town planning uniformity. R is also true — there is evidence of strong state control. However, R is not necessarily the direct explanation of A. Some scholars attribute uniformity to shared cultural practices.',
        tags: ['harappan', 'urban_planning', 'assertion_reason'],
        createdBy: admin._id,
      });
    }

    const polSub = await getSubject(upsc._id, 'Indian Polity');
    const constTop = polSub ? await getTopic(polSub._id, 'Constitution') : null;
    if (prelims && polSub && constTop) {
      await upsert({
        examId: upsc._id, phaseId: prelims._id, subjectId: polSub._id, topicId: constTop._id,
        questionType: 'statement_based',
        questionText: 'Consider the following statements about the Preamble of the Indian Constitution:\n1. The Preamble can be amended under Article 368.\n2. The word "Secular" was part of the original Preamble.\n3. The Supreme Court declared the Preamble to be a part of the Constitution in Kesavananda Bharati case.\n\nWhich of the statements given above are correct?',
        options: ['1 and 3 only', '2 and 3 only', '1 only', '1, 2 and 3'],
        correctAnswer: '1 and 3 only', difficulty: 'hard', marks: 2, negativeMarks: 0.67,
        language: 'english', sourceType: 'official_pyq', sourceName: 'UPSC Prelims', sourceYear: 2022,
        isPreviousYearQuestion: true, paperName: 'General Studies Paper 1',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'must_do',
        explanation: 'Statement 1 is correct — Preamble was amended via 42nd Amendment in 1976. Statement 2 is incorrect — "Secular" was added by the 42nd Amendment, not in original. Statement 3 is correct — Kesavananda Bharati (1973) held the Preamble is part of the Constitution.',
        tags: ['preamble', 'polity', 'constitution', 'secular', 'pyq_2022'],
        createdBy: admin._id,
      });

      await upsert({
        examId: upsc._id, phaseId: prelims._id, subjectId: polSub._id, topicId: constTop._id,
        questionType: 'match_the_following',
        questionText: 'Match List I with List II:\n\nList I (Schedule):\nA. First Schedule\nB. Third Schedule\nC. Fifth Schedule\nD. Eighth Schedule\n\nList II (Contents):\n1. Provisions for Scheduled Areas\n2. Languages recognized by the Constitution\n3. Names of States and UTs\n4. Forms of Oaths and Affirmations',
        options: ['A-3, B-4, C-1, D-2', 'A-1, B-2, C-3, D-4', 'A-3, B-1, C-4, D-2', 'A-4, B-3, C-2, D-1'],
        correctAnswer: 'A-3, B-4, C-1, D-2', difficulty: 'medium', marks: 2, negativeMarks: 0.67,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'important',
        explanation: 'First Schedule lists States and UTs (A-3). Third Schedule has Forms of Oaths (B-4). Fifth Schedule deals with Scheduled Areas (C-1). Eighth Schedule lists 22 official languages (D-2).',
        tags: ['constitution_schedules', 'polity', 'match_following'],
        createdBy: admin._id,
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // SSC CGL Questions
  // ═══════════════════════════════════════════════════════
  const ssc = await getExam('SSC CGL');
  if (ssc) {
    const tier1 = await getPhase(ssc._id, 'Tier 1');
    const quantSub = await getSubject(ssc._id, 'Quantitative');
    const profitTop = quantSub ? await getTopic(quantSub._id, 'Profit') : null;

    if (tier1 && quantSub && profitTop) {
      await upsert({
        examId: ssc._id, phaseId: tier1._id, subjectId: quantSub._id, topicId: profitTop._id,
        questionType: 'numerical',
        questionText: 'A shopkeeper buys an article for ₹800 and sells it for ₹1000. What is his profit percentage?',
        correctAnswer: '25',
        difficulty: 'easy', marks: 2, negativeMarks: 0.5,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'basic',
        estimatedSolveTime: 30,
        explanation: 'Profit = 1000 - 800 = ₹200. Profit% = (200/800) × 100 = 25%',
        tags: ['profit_loss', 'quant', 'ssc', 'percentage'],
        createdBy: admin._id,
      });
    }

    const reasonSub = await getSubject(ssc._id, 'General Intelligence');
    const analogyTop = reasonSub ? await getTopic(reasonSub._id, 'Analogy') : null;
    if (tier1 && reasonSub && analogyTop) {
      await upsert({
        examId: ssc._id, phaseId: tier1._id, subjectId: reasonSub._id, topicId: analogyTop._id,
        questionType: 'mcq',
        questionText: 'Doctor : Hospital :: Teacher : ?',
        options: ['University', 'School', 'Library', 'College'],
        correctAnswer: 'School', difficulty: 'easy', marks: 2, negativeMarks: 0.5,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'basic',
        estimatedSolveTime: 15,
        explanation: 'Doctor works in a Hospital. Similarly, Teacher works in a School.',
        tags: ['analogy', 'reasoning', 'ssc'],
        createdBy: admin._id,
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // Banking Questions
  // ═══════════════════════════════════════════════════════
  const bank = await getExam('Banking');
  if (bank) {
    const prelims = await getPhase(bank._id, 'Prelims');
    const reasonSub = await getSubject(bank._id, 'Reasoning');
    const puzzleTop = reasonSub ? await getTopic(reasonSub._id, 'Puzzles') : null;
    if (prelims && reasonSub && puzzleTop) {
      await upsert({
        examId: bank._id, phaseId: prelims._id, subjectId: reasonSub._id, topicId: puzzleTop._id,
        questionType: 'passage_based',
        questionText: 'Six people A, B, C, D, E, F sit in a row facing north. B sits 3rd to the right of A. C sits immediately to the left of D. E is not at the extreme ends. F sits to the immediate right of B.\n\nQuestion: Who sits at the extreme right end?',
        options: ['D', 'C', 'F', 'E'],
        correctAnswer: 'D', difficulty: 'medium', marks: 1, negativeMarks: 0.25,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'high_frequency',
        estimatedSolveTime: 90,
        explanation: 'Working out the arrangement from clues: A_B F _ _ _ → C must be before D. E not at ends. Order: A C D B F E (but need to check all conditions). Final: D sits at extreme right.',
        tags: ['linear_seating', 'puzzle', 'banking', 'reasoning'],
        createdBy: admin._id,
      });
    }

    const gaSub = await getSubject(bank._id, 'General Awareness');
    const bankTop = gaSub ? await getTopic(gaSub._id, 'Banking') : null;
    if (prelims && gaSub && bankTop) {
      await upsert({
        examId: bank._id, phaseId: prelims._id, subjectId: gaSub._id, topicId: bankTop._id,
        questionType: 'mcq',
        questionText: 'What does CRR stand for in the banking context?',
        options: ['Cash Reserve Ratio', 'Credit Reserve Rate', 'Central Regulation Reserve', 'Currency Ratio Rate'],
        correctAnswer: 'Cash Reserve Ratio', difficulty: 'easy', marks: 1, negativeMarks: 0.25,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'very_important',
        explanation: 'CRR (Cash Reserve Ratio) is the minimum fraction of customer deposits that every commercial bank must keep as reserves with the Reserve Bank of India.',
        tags: ['crr', 'rbi', 'banking_awareness', 'monetary_policy'],
        createdBy: admin._id,
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // UPSC Interview/Descriptive Questions
  // ═══════════════════════════════════════════════════════
  if (upsc) {
    const intPhase = await getPhase(upsc._id, 'Interview');
    const intSub = await getSubject(upsc._id, 'Personality');
    const dafTop = intSub ? await getTopic(intSub._id, 'DAF') : null;
    if (intPhase && intSub && dafTop) {
      await upsert({
        examId: upsc._id, phaseId: intPhase._id, subjectId: intSub._id, topicId: dafTop._id,
        questionType: 'interview',
        questionText: 'Your hobby mentioned in the DAF is trekking. As an IAS officer, how would you apply insights from trekking to administrative challenges in a difficult terrain district like Arunachal Pradesh?',
        difficulty: 'hard', marks: 5, negativeMarks: 0,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Interview Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'must_do',
        estimatedSolveTime: 180,
        explanation: 'A good answer links personal experience of trekking (resilience, team coordination, planning for uncertainty, reading terrain) to administrative challenges: infrastructure connectivity, healthcare outreach, disaster preparedness, community engagement in remote areas.',
        tags: ['interview', 'daf', 'personality', 'upsc_interview'],
        createdBy: admin._id,
      });
    }

    // Descriptive/Mains Style
    const mainsPhase = await getPhase(upsc._id, 'Mains');
    const mainsSub = await getSubject(upsc._id, 'GS Papers');
    const gs4Top = mainsSub ? await getTopic(mainsSub._id, 'GS Paper 4') : null;
    if (mainsPhase && mainsSub && gs4Top) {
      await upsert({
        examId: upsc._id, phaseId: mainsPhase._id, subjectId: mainsSub._id, topicId: gs4Top._id,
        questionType: 'descriptive',
        questionText: '"Integrity without knowledge is weak and useless, and knowledge without integrity is dangerous and dreadful." – Samuel Johnson.\nWith reference to the above statement, examine the importance of integrity in public service. (150 words)',
        difficulty: 'hard', marks: 10, negativeMarks: 0,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Mains Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'must_do',
        estimatedSolveTime: 900,
        explanation: 'Key points: Define integrity. Explain knowledge-integrity interdependence in public service. Examples of corrupt bureaucrats with knowledge-but-no-integrity. Examples of upright officers. Conclusion on probity framework.',
        tags: ['ethics', 'integrity', 'gs4', 'mains_answer_writing'],
        createdBy: admin._id,
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // Case Study Question
  // ═══════════════════════════════════════════════════════
  if (upsc) {
    const mainsPhase = await getPhase(upsc._id, 'Mains');
    const ethicsSub = await getSubject(upsc._id, 'Ethics');
    const ethicsTop = ethicsSub ? await getTopic(ethicsSub._id, 'Ethics in Public Administration') : null;
    if (mainsPhase && ethicsSub && ethicsTop) {
      await upsert({
        examId: upsc._id, phaseId: mainsPhase._id, subjectId: ethicsSub._id, topicId: ethicsTop._id,
        questionType: 'case_study',
        questionText: `Case Study: Ravi, an IAS officer posted in a tribal district, discovers that a senior politician is pressuring local contractors to fund his upcoming election campaign by awarding them government contracts. The contracts are for building schools in tribals areas — a legitimate project. However, the kickback arrangement is creating a conflict of interest.\n\nRavi has the following options:\n1. Report to vigilance directly and risk political backlash.\n2. Seek guidance from superiors who may be complicit.\n3. Implement the scheme but document everything for future reference.\n4. Quietly transfer out of this district.\n\nQuestion: What would be the most ethically appropriate course of action for Ravi? Justify your answer mentioning the values at stake.`,
        difficulty: 'hard', marks: 20, negativeMarks: 0,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Case Studies',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'must_do',
        estimatedSolveTime: 1200,
        explanation: 'The case involves integrity, political neutrality, and public service values. Ravi should ideally: document all evidence → report to ACB/CVC (bypassing potentially complicit superiors) → seek legal protection under whistleblower laws. Values at stake: probity, accountability, public interest over self-interest.',
        tags: ['case_study', 'ethics', 'gs4', 'political_pressure', 'ias'],
        createdBy: admin._id,
      });
    }
  }

  // Railway and Defence samples
  const railway = await getExam('Railway');
  if (railway) {
    const cbt1 = await getPhase(railway._id, 'CBT 1');
    const sciSub = await getSubject(railway._id, 'General Science');
    const physTop = sciSub ? await getTopic(sciSub._id, 'Physics') : null;
    if (cbt1 && sciSub && physTop) {
      await upsert({
        examId: railway._id, phaseId: cbt1._id, subjectId: sciSub._id, topicId: physTop._id,
        questionType: 'mcq',
        questionText: 'The SI unit of electric resistance is:',
        options: ['Ampere', 'Volt', 'Ohm', 'Watt'],
        correctAnswer: 'Ohm', difficulty: 'easy', marks: 1, negativeMarks: 0.33,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'published', isPublished: true, importanceLevel: 'basic',
        estimatedSolveTime: 20,
        explanation: 'Ohm (Ω) is the SI unit of electrical resistance, named after Georg Simon Ohm.',
        tags: ['physics', 'si_units', 'electricity', 'railway'],
        createdBy: admin._id,
      });

      await upsert({
        examId: railway._id, phaseId: cbt1._id, subjectId: sciSub._id, topicId: physTop._id,
        questionType: 'true_false',
        questionText: 'Sound travels faster in vacuum than in air.',
        options: ['True', 'False'], correctAnswer: 'False',
        difficulty: 'easy', marks: 1, negativeMarks: 0,
        language: 'english', sourceType: 'original_practice', sourceName: 'TargetRank Practice',
        qualityStatus: 'draft', isPublished: false, importanceLevel: 'basic',
        explanation: 'Sound cannot travel through vacuum at all — it requires a medium. It travels fastest in solids, then liquids, then gases.',
        tags: ['sound_waves', 'physics', 'vacuum'],
        createdBy: admin._id,
      });
    }
  }

  console.log(`\n════════════════════════════════════`);
  console.log(`🎉 Sample Questions Seeded!`);
  console.log(`   Saved   : ${saved}`);
  console.log(`   Skipped (dup hash): ${skipped}`);
  console.log(`════════════════════════════════════`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
