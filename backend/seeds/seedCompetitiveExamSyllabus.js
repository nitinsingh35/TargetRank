import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';
import User from '../models/User.js';

dotenv.config();

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const syllabusData = [
  // ── UPSC CIVIL SERVICES EXAMINATION ─────────────────────────────────────────
  {
    title: 'UPSC Civil Services Examination',
    shortDescription: 'Union Public Service Commission Civil Services Examination.',
    fullDescription: 'Comprehensive competitive exam conducted by UPSC for recruiting officers into administrative services.',
    conductingBody: 'UPSC',
    eligibility: 'Graduate, Age 21-32 years',
    examPattern: 'Three-stage selection: Prelims, Mains, and Personality Test.',
    phases: [
      {
        title: 'UPSC Prelims',
        description: 'Objective multiple choice screening test consisting of two papers.',
        order: 1,
        subjects: [
          {
            title: 'GS Paper I',
            description: 'General Studies paper covering history, polity, geography, economy, ecology, science & current affairs.',
            order: 1,
            topics: [
              {
                title: 'History',
                description: 'History of India and Indian National Movement.',
                recommendedStudyOrder: 1,
                estimatedWeightage: 'high',
                questionTarget: 150,
                pyqTarget: 20,
                subtopics: [
                  { title: 'Ancient India', description: 'Prehistoric era to post-Gupta developments.', weightage: 'medium' },
                  { title: 'Medieval India', description: 'Delhi Sultanate, Mughal Empire, and southern kingdoms.', weightage: 'low' },
                  { title: 'Modern India', description: 'Establishment of British rule to pre-independence changes.', weightage: 'high' },
                  { title: 'Indian National Movement', description: 'Satyagraha, freedom struggle, and partition dynamics.', weightage: 'high' },
                  { title: 'Art and Culture', description: 'Architecture, paintings, music, and literary arts.', weightage: 'medium' },
                  { title: 'Post-Independence India', description: 'State reorganisation, wars, and policy measures.', weightage: 'low' }
                ]
              },
              {
                title: 'Indian Polity and Governance',
                description: 'Constitution, Political System, Panchayati Raj, Public Policy, Rights Issues, etc.',
                recommendedStudyOrder: 2,
                estimatedWeightage: 'high',
                questionTarget: 150,
                pyqTarget: 25,
                subtopics: [
                  { title: 'Constitution', description: 'Preamble, schedules, features, amendments.', weightage: 'high' },
                  { title: 'Fundamental Rights', description: 'Fundamental Rights, Directive Principles, and Duties.', weightage: 'high' },
                  { title: 'Parliament', description: 'Structure, processes, bills, and parliamentary committees.', weightage: 'high' },
                  { title: 'President and Prime Minister', description: 'Executive powers, cabinet roles, and duties.', weightage: 'medium' },
                  { title: 'Judiciary', description: 'Supreme Court, High Court, and judicial review.', weightage: 'high' },
                  { title: 'Federalism', description: 'Centre-state relations, emergency clauses.', weightage: 'medium' },
                  { title: 'Local Government', description: 'Panchayati Raj and municipal corporations.', weightage: 'medium' },
                  { title: 'Constitutional Bodies', description: 'Election Commission, UPSC, CAG, Finance Commission.', weightage: 'medium' },
                  { title: 'Non-Constitutional Bodies', description: 'NITI Aayog, NHRC, CIC, Lokpal.', weightage: 'low' },
                  { title: 'Governance and Public Policy', description: 'Welfare schemes, citizen charters, and accountability.', weightage: 'medium' }
                ]
              },
              {
                title: 'Geography',
                description: 'Physical, Social, Economic Geography of India and the World.',
                recommendedStudyOrder: 3,
                estimatedWeightage: 'medium',
                questionTarget: 120,
                pyqTarget: 15,
                subtopics: [
                  { title: 'Physical Geography', description: 'Geomorphology, climatology, oceanography.', weightage: 'medium' },
                  { title: 'Indian Geography', description: 'Rivers, physiographic divisions, soils, vegetation.', weightage: 'high' },
                  { title: 'World Geography', description: 'Continents, global rivers, mountains, and regions.', weightage: 'low' },
                  { title: 'Climate', description: 'Monsoon mechanisms, climate classifications.', weightage: 'medium' },
                  { title: 'Resources', description: 'Minerals, energy sources, industrial distribution.', weightage: 'medium' },
                  { title: 'Agriculture', description: 'Cropping patterns, irrigation, farming models.', weightage: 'high' },
                  { title: 'Mapping', description: 'National parks, rivers, international hotspots mapping.', weightage: 'high' }
                ]
              },
              {
                title: 'Economy',
                description: 'Economic and Social Development – Sustainable Development, Poverty, Inclusion, Demographics, Social Sector Initiatives, etc.',
                recommendedStudyOrder: 4,
                estimatedWeightage: 'high',
                questionTarget: 150,
                pyqTarget: 20,
                subtopics: [
                  { title: 'Basic Concepts', description: 'GDP, national income, growth metrics.', weightage: 'medium' },
                  { title: 'Budget', description: 'Fiscal deficits, receipts, expenditure profiles.', weightage: 'high' },
                  { title: 'Banking', description: 'Monetary policy, RBI, NPA crisis, digital payments.', weightage: 'high' },
                  { title: 'Inflation', description: 'CPI, WPI, effects and mitigation steps.', weightage: 'medium' },
                  { title: 'Taxation', description: 'Direct, indirect taxes, GST reforms.', weightage: 'medium' },
                  { title: 'Agriculture Economy', description: 'Subsidies, MSP, land reforms, food security.', weightage: 'high' },
                  { title: 'External Sector', description: 'FDI, balance of payments, trade agreements.', weightage: 'medium' },
                  { title: 'Economic Survey', description: 'Recent economic trends, sectoral highlights.', weightage: 'high' },
                  { title: 'Government Schemes', description: 'Financial inclusion, employment, infrastructure plans.', weightage: 'high' }
                ]
              },
              {
                title: 'Environment and Ecology',
                description: 'General issues on Environmental Ecology, Bio-diversity and Climate Change - that do not require subject specialization.',
                recommendedStudyOrder: 5,
                estimatedWeightage: 'high',
                questionTarget: 140,
                pyqTarget: 20,
                subtopics: [
                  { title: 'Ecology', description: 'Food chains, trophic levels, nutrient cycles.', weightage: 'medium' },
                  { title: 'Biodiversity', description: 'Flora, fauna, hotspots, threats.', weightage: 'high' },
                  { title: 'Climate Change', description: 'Global warming, green house gases, carbon credits.', weightage: 'high' },
                  { title: 'Protected Areas', description: 'National parks, biosphere reserves, wildlife sanctuaries.', weightage: 'high' },
                  { title: 'Environmental Laws', description: 'Wildlife Protection Act, EPA, Forest Rights Act.', weightage: 'medium' },
                  { title: 'Species and Conservation', description: 'IUCN status, tiger reserves, Project Elephant.', weightage: 'high' }
                ]
              },
              {
                title: 'Science and Technology',
                description: 'Developments and applications in daily life, space, defence, IT, and biotechnology.',
                recommendedStudyOrder: 6,
                estimatedWeightage: 'medium',
                questionTarget: 110,
                pyqTarget: 12,
                subtopics: [
                  { title: 'Space', description: 'ISRO missions, satellites, deep space systems.', weightage: 'high' },
                  { title: 'Defence Technology', description: 'Missiles, warships, stealth systems, indigenisation.', weightage: 'medium' },
                  { title: 'Biotechnology', description: 'Genetics, CRISPR, GMO crops, vaccines.', weightage: 'high' },
                  { title: 'Health Science', description: 'Viruses, lifestyle diseases, medical breakthroughs.', weightage: 'medium' },
                  { title: 'IT and Digital Technology', description: 'AI, blockchain, cybersecurity, 5G/6G.', weightage: 'high' },
                  { title: 'Energy', description: 'Nuclear energy, solar power, green hydrogen.', weightage: 'medium' }
                ]
              },
              {
                title: 'Current Affairs',
                description: 'Current events of national and international importance.',
                recommendedStudyOrder: 7,
                estimatedWeightage: 'high',
                questionTarget: 200,
                pyqTarget: 25,
                subtopics: [
                  { title: 'National', description: 'Bills, governance changes, federal developments.', weightage: 'high' },
                  { title: 'International', description: 'Geopolitics, conflicts, bilateral treaties.', weightage: 'high' },
                  { title: 'Government Schemes', description: 'Welfare schemes, developmental programs.', weightage: 'high' },
                  { title: 'Reports and Indices', description: 'Global rankings, socio-economic surveys.', weightage: 'medium' },
                  { title: 'Awards', description: 'Prominent national and international awards.', weightage: 'low' },
                  { title: 'Sports', description: 'Major global meets, Olympics, championships.', weightage: 'low' },
                  { title: 'Important Days', description: 'Days of national and environment significance.', weightage: 'low' },
                  { title: 'Summits', description: 'G20, BRICS, SCO, COP conferences.', weightage: 'medium' }
                ]
              }
            ]
          },
          {
            title: 'CSAT Paper II',
            description: 'Aptitude paper covering mental ability, reasoning, and comprehension. (Qualifying - 33%).',
            order: 2,
            topics: [
              {
                title: 'General Mental Ability / CSAT',
                description: 'Comprehension, Logical reasoning and analytical ability, General mental ability, Basic numeracy.',
                recommendedStudyOrder: 1,
                estimatedWeightage: 'high',
                questionTarget: 100,
                pyqTarget: 15,
                subtopics: [
                  { title: 'Reading Comprehension', description: 'Passage solving, inference, central theme identification.', weightage: 'high' },
                  { title: 'Logical Reasoning', description: 'Syllogisms, blood relations, seating arrangements.', weightage: 'high' },
                  { title: 'Basic Numeracy', description: 'Averages, percentages, ratios, permutations.', weightage: 'high' },
                  { title: 'Data Interpretation', description: 'Pie charts, bar graphs, tables analysis.', weightage: 'medium' },
                  { title: 'Decision Making', description: 'Situational analysis, administrative action evaluation.', weightage: 'low' }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'UPSC Mains',
        description: 'Written descriptive stage comprising 9 papers.',
        order: 2,
        subjects: [
          {
            title: 'GS Papers',
            description: 'Four General Studies papers, one essay paper, and optional subjects papers.',
            order: 1,
            topics: [
              {
                title: 'GS I: Indian Heritage and Culture, History, Geography, Society',
                description: 'Mains General Studies Paper I core syllabus topics.',
                recommendedStudyOrder: 1,
                estimatedWeightage: 'high',
                questionTarget: 60,
                pyqTarget: 15,
                subtopics: []
              },
              {
                title: 'GS II: Constitution, Governance, Social Justice, International Relations',
                description: 'Mains General Studies Paper II core syllabus topics.',
                recommendedStudyOrder: 2,
                estimatedWeightage: 'high',
                questionTarget: 60,
                pyqTarget: 15,
                subtopics: []
              },
              {
                title: 'GS III: Economy, Agriculture, Science and Technology, Environment, Disaster Management, Internal Security',
                description: 'Mains General Studies Paper III core syllabus topics.',
                recommendedStudyOrder: 3,
                estimatedWeightage: 'high',
                questionTarget: 60,
                pyqTarget: 15,
                subtopics: []
              },
              {
                title: 'GS IV: Ethics, Integrity, Aptitude, Case Studies',
                description: 'Mains General Studies Paper IV ethics and case studies syllabus.',
                recommendedStudyOrder: 4,
                estimatedWeightage: 'high',
                questionTarget: 60,
                pyqTarget: 15,
                subtopics: []
              },
              {
                title: 'Essay',
                description: 'descriptive essays on two distinct themes.',
                recommendedStudyOrder: 5,
                estimatedWeightage: 'medium',
                questionTarget: 20,
                pyqTarget: 10,
                subtopics: []
              },
              {
                title: 'Optional Subject placeholder',
                description: 'Descriptive Paper I and Paper II for chosen Optional Subjects.',
                recommendedStudyOrder: 6,
                estimatedWeightage: 'high',
                questionTarget: 40,
                pyqTarget: 10,
                subtopics: []
              },
              {
                title: 'Personality Test / Interview',
                description: 'Oral interview evaluating personality, critical awareness, and leadership.',
                recommendedStudyOrder: 7,
                estimatedWeightage: 'medium',
                questionTarget: 0,
                pyqTarget: 0,
                subtopics: []
              }
            ]
          }
        ]
      }
    ]
  },
  // ── BPSC ────────────────────────────────────────────────────────────────────
  {
    title: 'BPSC State Services',
    shortDescription: 'Bihar Public Service Commission State Services Exam.',
    fullDescription: 'Provincial Civil Services exam for selecting state administrative officers in Bihar.',
    conductingBody: 'BPSC',
    eligibility: 'Graduate, Age 21-37 years',
    examPattern: 'Prelims objective screen, Mains descriptive, and Interview.',
    phases: [
      {
        title: 'BPSC Prelims',
        description: 'Single objective general studies paper (150 Marks).',
        order: 1,
        subjects: [
          {
            title: 'General Studies',
            description: 'GS paper combining general sciences, history, polity, geography, and Bihar special news.',
            order: 1,
            topics: [
              { title: 'Bihar History', description: 'History of Bihar with special reference to freedom movement.', recommendedStudyOrder: 1, estimatedWeightage: 'high', questionTarget: 100, pyqTarget: 15, subtopics: [] },
              { title: 'Bihar Geography', description: 'Rivers, forests, soils, and maps of Bihar.', recommendedStudyOrder: 2, estimatedWeightage: 'high', questionTarget: 100, pyqTarget: 15, subtopics: [] },
              { title: 'Bihar Economy', description: 'Bihar state budget, economic survey, and agriculture systems.', recommendedStudyOrder: 3, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Bihar Polity and Governance', description: 'Panchayati Raj in Bihar and administrative blocks.', recommendedStudyOrder: 4, estimatedWeightage: 'low', questionTarget: 50, pyqTarget: 8, subtopics: [] },
              { title: 'Bihar Current Affairs', description: 'State welfare schemes, reports, and events.', recommendedStudyOrder: 5, estimatedWeightage: 'high', questionTarget: 100, pyqTarget: 12, subtopics: [] },
              { title: 'Indian History', description: 'Ancient, Medieval, and Modern history of India.', recommendedStudyOrder: 6, estimatedWeightage: 'high', questionTarget: 120, pyqTarget: 18, subtopics: [] },
              { title: 'Indian Polity', description: 'Indian Constitution, parliament, and local governance.', recommendedStudyOrder: 7, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Geography', description: 'Physical and social geography of India and the world.', recommendedStudyOrder: 8, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Economy', description: 'Indian banking, planning, budget, and development indexes.', recommendedStudyOrder: 9, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'General Science', description: 'Basic concepts in Physics, Chemistry, Biology.', recommendedStudyOrder: 10, estimatedWeightage: 'high', questionTarget: 120, pyqTarget: 20, subtopics: [] },
              { title: 'Current Affairs', description: 'National and international news of prominence.', recommendedStudyOrder: 11, estimatedWeightage: 'high', questionTarget: 150, pyqTarget: 22, subtopics: [] },
              { title: 'General Mental Ability', description: 'Aptitude, puzzle solving, basic numeracy.', recommendedStudyOrder: 12, estimatedWeightage: 'low', questionTarget: 50, pyqTarget: 10, subtopics: [] }
            ]
          }
        ]
      },
      {
        title: 'BPSC Mains',
        description: 'Descriptive offline exam written papers stage.',
        order: 2,
        subjects: [
          {
            title: 'Mains Papers',
            description: 'Hindi language, GS I, GS II, Essay, and optional subject exams.',
            order: 1,
            topics: [
              { title: 'General Hindi', description: 'Qualifying Hindi grammar and writing paper.', recommendedStudyOrder: 1, estimatedWeightage: 'low', questionTarget: 30, pyqTarget: 5, subtopics: [] },
              { title: 'General Studies Paper I', description: 'Modern history, international events, and statistics analysis.', recommendedStudyOrder: 2, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 12, subtopics: [] },
              { title: 'General Studies Paper II', description: 'Indian polity, economy, geography, role of S&T.', recommendedStudyOrder: 3, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 12, subtopics: [] },
              { title: 'Essay', description: 'Analytical writing on Bihar socio-cultural issues.', recommendedStudyOrder: 4, estimatedWeightage: 'medium', questionTarget: 30, pyqTarget: 5, subtopics: [] },
              { title: 'Optional Subject placeholder', description: 'Mains optional chosen subject papers.', recommendedStudyOrder: 5, estimatedWeightage: 'medium', questionTarget: 40, pyqTarget: 5, subtopics: [] },
              { title: 'Interview', description: 'Face to face personality test.', recommendedStudyOrder: 6, estimatedWeightage: 'medium', questionTarget: 0, pyqTarget: 0, subtopics: [] }
            ]
          }
        ]
      }
    ]
  },
  // ── JPSC ────────────────────────────────────────────────────────────────────
  {
    title: 'JPSC State Services',
    shortDescription: 'Jharkhand Public Service Commission Exam.',
    fullDescription: 'Jharkhand administrative posts entry exam.',
    conductingBody: 'JPSC',
    eligibility: 'Graduate, Age 21-35 years',
    examPattern: 'Two objective papers in Prelims, Mains descriptive, and Personality test.',
    phases: [
      {
        title: 'JPSC Prelims Paper I',
        description: 'General Studies Paper I objective screening test.',
        order: 1,
        subjects: [
          {
            title: 'General Studies I',
            description: 'History, Polity, Economy, Jharkhand special General Studies.',
            order: 1,
            topics: [
              { title: 'Jharkhand History', description: 'History and movement for statehood in Jharkhand.', recommendedStudyOrder: 1, estimatedWeightage: 'high', questionTarget: 90, pyqTarget: 12, subtopics: [] },
              { title: 'Jharkhand Geography', description: 'Forests, mines, land tenure laws (CNT/SPT).', recommendedStudyOrder: 2, estimatedWeightage: 'high', questionTarget: 90, pyqTarget: 12, subtopics: [] },
              { title: 'Jharkhand Economy', description: 'Jharkhand industrialization, mines resources.', recommendedStudyOrder: 3, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Jharkhand Culture', description: 'Folk arts, tribes, language, and cultural sites.', recommendedStudyOrder: 4, estimatedWeightage: 'medium', questionTarget: 70, pyqTarget: 8, subtopics: [] },
              { title: 'Jharkhand Current Affairs', description: 'State schemes, budget, state indices.', recommendedStudyOrder: 5, estimatedWeightage: 'high', questionTarget: 100, pyqTarget: 10, subtopics: [] },
              { title: 'Indian History', description: 'Socio-political history of ancient, medieval, modern India.', recommendedStudyOrder: 6, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Polity', description: 'Constitution, federal structures, Panchayats.', recommendedStudyOrder: 7, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Geography', description: 'Physical and resource geography of India.', recommendedStudyOrder: 8, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Economy', description: 'Indian planning, banking, poverty metrics.', recommendedStudyOrder: 9, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Environment', description: 'Climate change biodiversity laws.', recommendedStudyOrder: 10, estimatedWeightage: 'low', questionTarget: 50, pyqTarget: 6, subtopics: [] },
              { title: 'Current Affairs', description: 'National and global events.', recommendedStudyOrder: 11, estimatedWeightage: 'high', questionTarget: 120, pyqTarget: 15, subtopics: [] }
            ]
          }
        ]
      },
      {
        title: 'JPSC Prelims Paper II',
        description: 'Jharkhand specific General Studies Paper II.',
        order: 2,
        subjects: [
          {
            title: 'General Studies II',
            description: 'General Science, Reasoning, Aptitude, and Computers.',
            order: 1,
            topics: [
              { title: 'General Science', description: 'Daily life sciences, agriculture and S&T.', recommendedStudyOrder: 1, estimatedWeightage: 'high', questionTarget: 100, pyqTarget: 15, subtopics: [] },
              { title: 'Reasoning', description: 'Verbal and non-verbal reasoning problems.', recommendedStudyOrder: 2, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Quantitative Aptitude', description: 'Numbers system, profit loss, graphs.', recommendedStudyOrder: 3, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Computer', description: 'Hardware, software, Internet networks.', recommendedStudyOrder: 4, estimatedWeightage: 'low', questionTarget: 50, pyqTarget: 8, subtopics: [] }
            ]
          }
        ]
      },
      {
        title: 'JPSC Mains',
        description: 'Mains written descriptive papers.',
        order: 3,
        subjects: [
          {
            title: 'GS & Language',
            description: 'Language paper and General Studies papers.',
            order: 1,
            topics: [
              { title: 'Language', description: 'General Hindi and General English descriptive paper.', recommendedStudyOrder: 1, estimatedWeightage: 'low', questionTarget: 30, pyqTarget: 5, subtopics: [] },
              { title: 'GS I', description: 'Indian history, geography, society.', recommendedStudyOrder: 2, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS II', description: 'Indian constitution, polity, decentralization.', recommendedStudyOrder: 3, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS III', description: 'Indian economy, globalization, sustainable development.', recommendedStudyOrder: 4, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS IV', description: 'General science, environment S&T.', recommendedStudyOrder: 5, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'Essay', description: 'Descriptive essays on two topics.', recommendedStudyOrder: 6, estimatedWeightage: 'medium', questionTarget: 25, pyqTarget: 5, subtopics: [] },
              { title: 'Interview', description: 'Personal assessment interview.', recommendedStudyOrder: 7, estimatedWeightage: 'medium', questionTarget: 0, pyqTarget: 0, subtopics: [] }
            ]
          }
        ]
      }
    ]
  },
  // ── UPPSC / UPPCS ──────────────────────────────────────────────────────────
  {
    title: 'UPPSC State Services',
    shortDescription: 'Uttar Pradesh Public Service Commission Combined State Services Exam.',
    fullDescription: 'Administrative posts selection exam in Uttar Pradesh.',
    conductingBody: 'UPPSC',
    eligibility: 'Graduate, Age 21-40 years',
    examPattern: 'Two papers in Prelims (GS + CSAT), Mains descriptive papers GS 1-6, and Interview.',
    phases: [
      {
        title: 'UPPSC Prelims Paper I',
        description: 'General Studies Paper I objective screening test.',
        order: 1,
        subjects: [
          {
            title: 'General Studies I',
            description: 'History, Polity, Economy, and Uttar Pradesh special GK.',
            order: 1,
            topics: [
              { title: 'Uttar Pradesh History', description: 'Freedom struggle and archaeological sites in UP.', recommendedStudyOrder: 1, estimatedWeightage: 'high', questionTarget: 100, pyqTarget: 15, subtopics: [] },
              { title: 'Uttar Pradesh Geography', description: 'Soils, rivers, climate, canals, and mapping of UP.', recommendedStudyOrder: 2, estimatedWeightage: 'high', questionTarget: 100, pyqTarget: 15, subtopics: [] },
              { title: 'Uttar Pradesh Economy', description: 'UP Budget, economic indices, agriculture profile.', recommendedStudyOrder: 3, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Uttar Pradesh Culture', description: 'Gharanas, folk dances, architecture, festivals.', recommendedStudyOrder: 4, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Uttar Pradesh Current Affairs', description: 'Schemes, awards, and appointments in UP state.', recommendedStudyOrder: 5, estimatedWeightage: 'high', questionTarget: 95, pyqTarget: 12, subtopics: [] },
              { title: 'Indian History', description: 'Ancient, Medieval, and Modern Indian history.', recommendedStudyOrder: 6, estimatedWeightage: 'high', questionTarget: 120, pyqTarget: 20, subtopics: [] },
              { title: 'Polity', description: 'Constitution of India, governance, public policy.', recommendedStudyOrder: 7, estimatedWeightage: 'high', questionTarget: 110, pyqTarget: 18, subtopics: [] },
              { title: 'Geography', description: 'Physical and socio-economic geography.', recommendedStudyOrder: 8, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Economy', description: 'Indian planning, banking, public finance.', recommendedStudyOrder: 9, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Environment', description: 'Biodiversity, climate change policies.', recommendedStudyOrder: 10, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Science and Technology', description: 'Basic daily sciences, space and defence technology.', recommendedStudyOrder: 11, estimatedWeightage: 'medium', questionTarget: 80, pyqTarget: 10, subtopics: [] },
              { title: 'Current Affairs', description: 'National and international news events.', recommendedStudyOrder: 12, estimatedWeightage: 'high', questionTarget: 150, pyqTarget: 25, subtopics: [] }
            ]
          }
        ]
      },
      {
        title: 'UPPSC Prelims CSAT',
        description: 'CSAT Paper II objective aptitude paper (Qualifying).',
        order: 2,
        subjects: [
          {
            title: 'CSAT Paper II',
            description: 'Mathematics, Reasoning, Comprehension, and Data interpretation.',
            order: 1,
            topics: [
              { title: 'Comprehension', description: 'Passage inferences and language grammar checks.', recommendedStudyOrder: 1, estimatedWeightage: 'medium', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'Reasoning', description: 'Mental ability, coding-decoding, syllogisms.', recommendedStudyOrder: 2, estimatedWeightage: 'high', questionTarget: 80, pyqTarget: 12, subtopics: [] },
              { title: 'Mathematics', description: 'Arithmetic, simple algebra, geometry.', recommendedStudyOrder: 3, estimatedWeightage: 'high', questionTarget: 80, pyqTarget: 12, subtopics: [] },
              { title: 'Data Interpretation', description: 'Data tables, charts analysis.', recommendedStudyOrder: 4, estimatedWeightage: 'low', questionTarget: 40, pyqTarget: 8, subtopics: [] }
            ]
          }
        ]
      },
      {
        title: 'UPPSC Mains',
        description: 'Descriptive written papers (Hindi, Essay, GS 1-6).',
        order: 3,
        subjects: [
          {
            title: 'Mains GS & Papers',
            description: 'Comprehensive papers covering GS and UP special topics.',
            order: 1,
            topics: [
              { title: 'General Hindi', description: 'Qualifying descriptive paper evaluating Hindi structures.', recommendedStudyOrder: 1, estimatedWeightage: 'low', questionTarget: 30, pyqTarget: 5, subtopics: [] },
              { title: 'Essay', description: 'Three essay topics descriptive writing.', recommendedStudyOrder: 2, estimatedWeightage: 'medium', questionTarget: 25, pyqTarget: 5, subtopics: [] },
              { title: 'GS I', description: 'History, geography, and society dynamics.', recommendedStudyOrder: 3, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS II', description: 'Constitution, polity, social justice.', recommendedStudyOrder: 4, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS III', description: 'Economy, security, environment S&T.', recommendedStudyOrder: 5, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS IV', description: 'Ethics and case studies.', recommendedStudyOrder: 6, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS V Uttar Pradesh Special', description: 'Uttar Pradesh polity, history, and administration special.', recommendedStudyOrder: 7, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'GS VI Uttar Pradesh Special', description: 'Uttar Pradesh economy, geography, S&T special.', recommendedStudyOrder: 8, estimatedWeightage: 'high', questionTarget: 60, pyqTarget: 10, subtopics: [] },
              { title: 'Interview', description: 'Face-to-face viva assessment.', recommendedStudyOrder: 9, estimatedWeightage: 'medium', questionTarget: 0, pyqTarget: 0, subtopics: [] }
            ]
          }
        ]
      }
    ]
  }
];

const seedSyllabus = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting Idempotent Syllabus Seeds process...\n');

    // Retrieve or choose an admin user ID
    const admin = await User.findOne({ role: 'admin' });
    const createdBy = admin?._id || new mongoose.Types.ObjectId();

    let examsSeeded = 0;
    let phasesSeeded = 0;
    let subjectsSeeded = 0;
    let topicsSeeded = 0;
    let subtopicsSeeded = 0;

    for (const examData of syllabusData) {
      const examSlug = slugify(examData.title);

      // Create/Update Exam
      const exam = await Exam.findOneAndUpdate(
        { slug: examSlug },
        {
          title: examData.title,
          shortDescription: examData.shortDescription,
          fullDescription: examData.fullDescription,
          conductingBody: examData.conductingBody,
          eligibility: examData.eligibility,
          examPattern: examData.examPattern,
          createdBy,
          active: true,
        },
        { upsert: true, new: true, runValidators: true }
      );
      examsSeeded++;
      console.log(`📚 Seeded Exam: ${exam.title} (${exam.slug})`);

      for (const phaseData of examData.phases) {
        const phaseSlug = slugify(phaseData.title);

        // Create/Update Phase
        const phase = await ExamPhase.findOneAndUpdate(
          { examId: exam._id, slug: phaseSlug },
          {
            title: phaseData.title,
            description: phaseData.description,
            order: phaseData.order,
            active: true,
          },
          { upsert: true, new: true, runValidators: true }
        );
        phasesSeeded++;
        console.log(`   ├─ Seeded Phase: ${phase.title} (${phase.slug})`);

        for (const subjectData of phaseData.subjects) {
          const subjectSlug = slugify(subjectData.title);

          // Create/Update Subject
          const subject = await Subject.findOneAndUpdate(
            { phaseId: phase._id, slug: subjectSlug },
            {
              examId: exam._id,
              title: subjectData.title,
              description: subjectData.description,
              order: subjectData.order,
              active: true,
            },
            { upsert: true, new: true, runValidators: true }
          );
          subjectsSeeded++;
          console.log(`      ├─ Seeded Subject: ${subject.title} (${subject.slug})`);

          for (const topicData of subjectData.topics) {
            const topicSlug = slugify(topicData.title);

            // Create/Update Topic
            const topic = await Topic.findOneAndUpdate(
              { subjectId: subject._id, slug: topicSlug },
              {
                examId: exam._id,
                phaseId: phase._id,
                title: topicData.title,
                description: topicData.description,
                recommendedStudyOrder: topicData.recommendedStudyOrder,
                estimatedWeightage: topicData.estimatedWeightage,
                questionTarget: topicData.questionTarget,
                pyqTarget: topicData.pyqTarget,
                languageSupport: topicData.languageSupport || 'bilingual',
                order: topicData.recommendedStudyOrder,
                active: true,
              },
              { upsert: true, new: true, runValidators: true }
            );
            topicsSeeded++;
            console.log(`         ├─ Seeded Topic: ${topic.title} (${topic.slug})`);

            // Seed subtopics if present
            if (topicData.subtopics && topicData.subtopics.length > 0) {
              for (const subtopicData of topicData.subtopics) {
                const subtopicSlug = slugify(subtopicData.title);

                // Create/Update Subtopic
                const subtopic = await Subtopic.findOneAndUpdate(
                  { topicId: topic._id, slug: subtopicSlug },
                  {
                    examId: exam._id,
                    phaseId: phase._id,
                    subjectId: subject._id,
                    title: subtopicData.title,
                    description: subtopicData.description,
                    estimatedWeightage: subtopicData.weightage || 'medium',
                    recommendedStudyOrder: subtopicData.recommendedStudyOrder || 0,
                    questionTarget: subtopicData.questionTarget || 30,
                    pyqTarget: subtopicData.pyqTarget || 3,
                    languageSupport: 'bilingual',
                    active: true,
                  },
                  { upsert: true, new: true, runValidators: true }
                );
                subtopicsSeeded++;
              }
              console.log(`         │  └─ Seeded ${topicData.subtopics.length} Subtopics`);
            }
          }
        }
      }
      console.log('');
    }

    console.log('✅ Idempotent Syllabus seeding process completed successfully!');
    console.log(`Summary:`);
    console.log(`- Exams Seeded: ${examsSeeded}`);
    console.log(`- Phases Seeded: ${phasesSeeded}`);
    console.log(`- Subjects Seeded: ${subjectsSeeded}`);
    console.log(`- Topics Seeded: ${topicsSeeded}`);
    console.log(`- Subtopics Seeded: ${subtopicsSeeded}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Idempotent seed failed:', err.message);
    process.exit(1);
  }
};

seedSyllabus();
