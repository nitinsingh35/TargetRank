import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';
import User from '../models/User.js';

dotenv.config();

const isReset = process.argv.includes('--reset');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
    console.log(`🔌 Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected.');

    if (isReset) {
      console.log('🔄 Reset option specified. Clearing syllabus tables...');
      await Exam.deleteMany({});
      await ExamPhase.deleteMany({});
      await Subject.deleteMany({});
      await Topic.deleteMany({});
      await Subtopic.deleteMany({});
      console.log('✅ Tables cleared.');
    }

    // Ensure we have an admin user for createdBy reference
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Seed Admin',
        email: 'admin@targetrank.com',
        password: 'Test@123',
        role: 'admin',
        active: true,
      });
      console.log('👤 Created default seed admin.');
    }

    // Helper functions for safe upserts
    const getOrCreateExam = async (title, conductingBody, shortDesc, eligibility, pattern) => {
      const slug = slugify(title);
      let ex = await Exam.findOne({ slug });
      if (!ex) {
        ex = await Exam.create({
          title,
          slug,
          shortDescription: shortDesc || title,
          conductingBody: conductingBody || 'Official Board',
          eligibility: eligibility || 'Graduation',
          examPattern: pattern || 'MCQ/Written',
          active: true,
          isPublished: true,
          isArchived: false,
          createdBy: admin._id,
        });
        console.log(`🎯 Created Exam: ${title}`);
      }
      return ex;
    };

    const getOrCreatePhase = async (examId, title) => {
      const slug = slugify(title);
      let phase = await ExamPhase.findOne({ examId, slug });
      if (!phase) {
        phase = await ExamPhase.create({
          examId,
          title,
          slug,
          description: `${title} stage`,
          active: true,
          isPublished: true,
          isArchived: false,
          createdBy: admin._id,
        });
        console.log(`  ⚡ Phase: ${title}`);
      }
      return phase;
    };

    const getOrCreateSubject = async (examId, phaseId, title, desc) => {
      const slug = slugify(title);
      let sub = await Subject.findOne({ examId, phaseId, slug });
      if (!sub) {
        sub = await Subject.create({
          examId,
          phaseId,
          title,
          slug,
          description: desc || title,
          active: true,
          isPublished: true,
          isArchived: false,
          createdBy: admin._id,
        });
        console.log(`    📚 Subject: ${title}`);
      }
      return sub;
    };

    const getOrCreateTopic = async (examId, phaseId, subjectId, title) => {
      const slug = slugify(title);
      let top = await Topic.findOne({ subjectId, slug });
      if (!top) {
        top = await Topic.create({
          examId,
          phaseId,
          subjectId,
          title,
          slug,
          description: title,
          active: true,
          isPublished: true,
          isArchived: false,
          createdBy: admin._id,
        });
        console.log(`      ✏️ Topic: ${title}`);
      }
      return top;
    };

    const getOrCreateSubtopic = async (examId, phaseId, subjectId, topicId, title) => {
      const slug = slugify(title);
      let subtop = await Subtopic.findOne({ topicId, slug });
      if (!subtop) {
        subtop = await Subtopic.create({
          examId,
          phaseId,
          subjectId,
          topicId,
          title,
          slug,
          description: title,
          active: true,
          isPublished: true,
          isArchived: false,
          createdBy: admin._id,
        });
      }
      return subtop;
    };

    // ─── EXAMS LIST ───
    const examsData = [
      {
        name: 'UPSC CSE',
        body: 'Union Public Service Commission',
        desc: 'Civil Services Examination for IAS, IPS, IFS, and Central Group A services.',
        eligibility: 'Graduate in any discipline. Age 21-32.',
        pattern: 'Prelims (MCQ), Mains (Written), Interview (Oral)',
        subjects: [
          {
            name: 'History & Culture',
            topics: {
              'Ancient India': ['Prehistoric Period', 'Indus Valley Civilization', 'Vedic Age', 'Maurya Empire', 'Gupta Empire'],
              'Medieval India': ['Delhi Sultanate', 'Mughal Empire', 'Maratha Empire', 'Bhakti & Sufi Movement'],
              'Modern India': ['East India Company Rule', 'Revolt of 1857', 'Socio-Religious Reforms', 'Indian Freedom Struggle'],
              'Art & Culture': ['Indian Architecture', 'Classical Dances of India', 'Indian Paintings', 'Music & Drama']
            }
          },
          {
            name: 'Geography',
            topics: {
              'Physical Geography': ['Geomorphology', 'Climatology', 'Oceanography'],
              'Indian Geography': ['Physiography of India', 'Indian River Systems', 'Monsoons & Climate', 'Soils & Vegetation'],
              'World Geography': ['Major Continents', 'Global Climate Zones', 'World Natural Resources']
            }
          },
          {
            name: 'Polity & Governance',
            topics: {
              'Constitution': ['Preamble & Key Features', 'Fundamental Rights & Duties', 'Directive Principles of State Policy'],
              'Parliament': ['Lok Sabha & Rajya Sabha', 'Legislative Procedure', 'Parliamentary Committees'],
              'Judiciary': ['Supreme Court of India', 'High Courts & Subordinate Courts', 'Judicial Review & Activism']
            }
          },
          {
            name: 'Economy',
            topics: {
              'Basic Economics': ['National Income accounting', 'Economic Planning', 'Poverty & Unemployment'],
              'Banking & Finance': ['Reserve Bank of India', 'Monetary Policy', 'Commercial Banking & NPAs'],
              'Fiscal Policy': ['Union Budget', 'Taxation Reforms & GST', 'Public Debt']
            }
          }
        ]
      },
      {
        name: 'BPSC',
        body: 'Bihar Public Service Commission',
        desc: 'Bihar Provincial Civil Services Examination.',
        eligibility: 'Graduate in any discipline. Age 21-37.',
        pattern: 'Prelims (MCQ), Mains (Written), Interview',
        subjects: [
          {
            name: 'General Studies & Bihar GK',
            topics: {
              'Bihar History': ['Ancient History of Bihar', 'Medieval Bihar', 'Freedom Movement in Bihar'],
              'Bihar Geography': ['Physical Divisions of Bihar', 'Rivers & Soil of Bihar', 'Forests & Wildlife of Bihar'],
              'Bihar Economy': ['Agriculture in Bihar', 'Industrial Development in Bihar', 'Bihar Budget & Economic Survey']
            }
          }
        ]
      },
      {
        name: 'JPSC',
        body: 'Jharkhand Public Service Commission',
        desc: 'Jharkhand Provincial Civil Services Examination.',
        eligibility: 'Graduate in any discipline. Age 21-35.',
        pattern: 'Prelims, Mains, Interview',
        subjects: [
          {
            name: 'General Studies & Jharkhand GK',
            topics: {
              'Jharkhand History': ['Tribal Rebellions in Jharkhand', 'Jharkhand Freedom Fighters', 'Creation of Jharkhand State'],
              'Jharkhand Geography': ['Chhota Nagpur Plateau', 'Mineral Resources of Jharkhand', 'Rivers & Waterfalls of Jharkhand'],
              'Jharkhand Culture': ['Tribal Festivals', 'Folk Dances & Music of Jharkhand', 'Traditional Art Forms']
            }
          }
        ]
      },
      {
        name: 'UPPSC',
        body: 'Uttar Pradesh Public Service Commission',
        desc: 'Uttar Pradesh Provincial Civil Services Examination.',
        eligibility: 'Graduate in any discipline. Age 21-40.',
        pattern: 'Prelims, Mains, Interview',
        subjects: [
          {
            name: 'General Studies & UP GK',
            topics: {
              'Uttar Pradesh History': ['Ancient & Medieval history of UP', '1857 Revolt in UP', 'National Movement & UP leaders'],
              'Uttar Pradesh Geography': ['Gangetic Plains of UP', 'Climate & Forests of UP', 'Rivers & Dams of UP'],
              'Uttar Pradesh Economy': ['One District One Product (ODOP)', 'UP Agriculture & Irrigation', 'UP Budget']
            }
          }
        ]
      },
      {
        name: 'SSC CGL',
        body: 'Staff Selection Commission',
        desc: 'Combined Graduate Level Exam for assistant section officers, inspectors, etc.',
        eligibility: 'Graduate in any discipline. Age 18-30.',
        pattern: 'Tier I (MCQ), Tier II (MCQ + Skill Test)',
        subjects: [
          {
            name: 'Quantitative Aptitude',
            topics: {
              'Arithmetic': ['Percentage', 'Profit & Loss', 'Simple & Compound Interest', 'Ratio & Proportion', 'Time & Work'],
              'Algebra': ['Linear Equations', 'Quadratic Equations', 'Algebraic Identities'],
              'Geometry': ['Lines & Angles', 'Triangles & Circles', 'Polygons'],
              'Trigonometry': ['Trigonometric Ratios', 'Heights & Distances', 'Trigonometric Identities']
            }
          },
          {
            name: 'General Intelligence & Reasoning',
            topics: {
              'Verbal Reasoning': ['Analogy', 'Classification', 'Coding-Decoding', 'Blood Relations', 'Syllogism'],
              'Non-Verbal Reasoning': ['Mirror Images', 'Paper Folding', 'Pattern Completion', 'Embedded Figures']
            }
          },
          {
            name: 'English Comprehension',
            topics: {
              'Grammar': ['Parts of Speech', 'Subject-Verb Agreement', 'Active & Passive Voice', 'Direct & Indirect Speech'],
              'Vocabulary': ['Synonyms & Antonyms', 'One Word Substitution', 'Idioms & Phrases']
            }
          }
        ]
      },
      {
        name: 'Banking Exams',
        body: 'IBPS / SBI / RBI',
        desc: 'Probationary Officers (PO) and Clerks Recruitment Exams.',
        eligibility: 'Graduate in any discipline. Age 20-30.',
        pattern: 'Prelims, Mains, Group Discussion & Interview',
        subjects: [
          {
            name: 'Quantitative Aptitude',
            topics: {
              'Data Interpretation': ['Bar Graphs', 'Line Charts', 'Pie Charts', 'Tabular DI', 'Caselets'],
              'Arithmetic Word Problems': ['Averages', 'Partnership', 'Mixtures & Alligation', 'Probability']
            }
          },
          {
            name: 'Reasoning Ability',
            topics: {
              'Puzzles': ['Floor Puzzles', 'Box Puzzles', 'Scheduling Puzzles'],
              'Logical Reasoning': ['Input-Output', 'Data Sufficiency', 'Coding Inequalities', 'Directions & Coding']
            }
          }
        ]
      },
      {
        name: 'Railway Exams',
        body: 'Railway Recruitment Board',
        desc: 'RRB NTPC, Group D, and ALP recruitment exams.',
        eligibility: '10th / 12th / Graduate. Age 18-33.',
        pattern: 'CBT 1, CBT 2, Skill/Aptitude Test',
        subjects: [
          {
            name: 'Mathematics',
            topics: {
              'Number System': ['Fractions & Decimals', 'LCM & HCF', 'Simplification'],
              'Arithmetic': ['Ratios', 'Percentages', 'Averages', 'Speed Distance & Time']
            }
          },
          {
            name: 'General Science',
            topics: {
              'Physics': ['Units & Dimensions', 'Work, Power & Energy', 'Light & Sound'],
              'Chemistry': ['Periodic Table', 'Acids, Bases & Salts', 'Metals & Non-metals'],
              'Life Sciences': ['Human Anatomy', 'Plant Classification', 'Diseases & Nutrition']
            }
          }
        ]
      },
      {
        name: 'Defence Exams',
        body: 'UPSC / CDS / NDA',
        desc: 'Combined Defence Services and National Defence Academy exams.',
        eligibility: '12th (NDA) / Graduate (CDS). Age 16.5 - 24.',
        pattern: 'Written Exam, SSB Interview (Personality/Intelligence test)',
        subjects: [
          {
            name: 'Mathematics & General Knowledge',
            topics: {
              'Calculus': ['Limits & Continuity', 'Differentiation', 'Integration'],
              'General Knowledge': ['Indian Freedom Movement', 'General Science', 'Defence Current Affairs']
            }
          }
        ]
      }
    ];

    const phases = ['Foundation', 'Prelims', 'Mains', 'Interview'];

    for (const exData of examsData) {
      // 1. Create/Update Exam
      const exam = await getOrCreateExam(exData.name, exData.body, exData.desc, exData.eligibility, exData.pattern);

      for (const pName of phases) {
        // 2. Create/Update Phase
        const phaseTitle = `${exData.name} ${pName}`;
        const phase = await getOrCreatePhase(exam._id, phaseTitle);

        // 3. Add Subjects under this phase
        for (const subData of exData.subjects) {
          const subject = await getOrCreateSubject(exam._id, phase._id, subData.name);

          // 4. Add Topics under this subject
          for (const [tTitle, stList] of Object.entries(subData.topics)) {
            const topic = await getOrCreateTopic(exam._id, phase._id, subject._id, tTitle);

            // 5. Add Subtopics under this topic
            for (const stTitle of stList) {
              await getOrCreateSubtopic(exam._id, phase._id, subject._id, topic._id, stTitle);
            }
          }
        }
      }
    }

    console.log('============================================================');
    console.log('🎉 TargetRank Comprehensive Syllabus Seeding Completed successfully!');
    console.log('============================================================');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exam syllabus:', error);
    process.exit(1);
  }
};

run();
