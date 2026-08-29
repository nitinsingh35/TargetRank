/**
 * Seed data for TargetRank Phase 2
 * Hierarchy: Exam → Phase → Subject → Topic (with subtopics)
 */

const topic = (title, subtopics = [], hours = 4, description = '') => ({
  title,
  description,
  estimatedStudyHours: hours,
  subtopics: subtopics.map((st) =>
    typeof st === 'string' ? { title: st, description: '' } : st
  ),
});

const subject = (title, topics, description = '', order = 0) => ({
  title,
  description,
  order,
  topics,
});

const phase = (title, subjects, description = '', order = 0) => ({
  title,
  description,
  order,
  subjects,
});

export const examSeedData = [
  {
    title: 'UPSC CSE',
    slug: 'upsc-cse',
    shortDescription: 'India\'s most prestigious civil services examination for IAS, IPS, IFS and allied services.',
    fullDescription: 'The Civil Services Examination (CSE) is conducted by the Union Public Service Commission for recruitment to various Group A and Group B services including IAS, IPS, IFS, IRS, and more. The exam consists of Prelims, Mains, and Personality Test stages.',
    conductingBody: 'Union Public Service Commission (UPSC)',
    eligibility: 'Graduate in any discipline. Age 21-32 years (General category).',
    examPattern: 'Prelims (2 papers, MCQ) → Mains (9 papers, descriptive) → Interview (275 marks)',
    importantDates: [
      { label: 'Notification', date: 'February 2026' },
      { label: 'Prelims Exam', date: 'May 2026' },
      { label: 'Mains Exam', date: 'September 2026' },
    ],
    phases: [
      phase('Prelims', [
        subject('History', [
          topic('Ancient India', ['Indus Valley Civilization', 'Vedic Period', 'Mauryan Empire', 'Gupta Period'], 8),
          topic('Medieval India', ['Delhi Sultanate', 'Mughal Empire', 'Bhakti & Sufi Movements', 'Maratha Empire'], 8),
          topic('Modern India', ['Advent of Europeans', 'Revolt of 1857', 'Freedom Struggle', 'Post-Independence India'], 10),
        ], 'Indian History from ancient to modern times', 1),
        subject('Geography', [
          topic('Physical Geography', ['Geomorphology', 'Climatology', 'Oceanography', 'Biogeography'], 8),
          topic('Indian Geography', ['Physiography', 'Climate & Monsoon', 'Soils & Vegetation', 'Natural Resources'], 8),
          topic('World Geography', ['Continents & Oceans', 'Major Landforms', 'Climate Zones'], 6),
        ], 'Physical, Indian and World Geography', 2),
        subject('Indian Polity', [
          topic('Constitution & Preamble', ['Salient Features', 'Preamble', 'Sources of Constitution'], 6),
          topic('Fundamental Rights', ['Article 12-35', 'Right to Equality', 'Right to Freedom', 'Right against Exploitation'], 8),
          topic('Directive Principles', ['DPSP Overview', 'Fundamental Duties', 'Comparison with FRs'], 5),
          topic('Parliament & Legislature', ['Lok Sabha', 'Rajya Sabha', 'Law-making Process', 'Parliamentary Committees'], 7),
        ], 'Indian Constitution, governance and polity', 3),
        subject('Economy', [
          topic('Basic Concepts', ['GDP, GNP, NNP', 'Inflation', 'Fiscal & Monetary Policy'], 6),
          topic('Indian Economy', ['Planning in India', 'Banking & Finance', 'Agriculture & Industry'], 8),
          topic('Economic Reforms', ['Liberalization', 'Privatization', 'Globalization', 'GST'], 6),
        ], 'Indian Economy and economic development', 4),
        subject('Environment', [
          topic('Ecology Basics', ['Ecosystem', 'Food Chain & Web', 'Biodiversity'], 5),
          topic('Environmental Issues', ['Climate Change', 'Pollution', 'Conservation Efforts'], 6),
          topic('Environmental Laws', ['Wildlife Protection Act', 'Forest Conservation', 'EPA 1986'], 4),
        ], 'Environment and ecology', 5),
        subject('Science and Technology', [
          topic('Physics & Chemistry Basics', ['Units & Measurements', 'Atomic Structure', 'Chemical Reactions'], 5),
          topic('Biology & Health', ['Cell Biology', 'Human Body Systems', 'Diseases & Vaccines'], 6),
          topic('Technology & Space', ['ISRO Missions', 'AI & Robotics', 'Biotechnology'], 6),
        ], 'General science and recent developments', 6),
        subject('Current Affairs', [
          topic('National Affairs', ['Government Schemes', 'Legislative Updates', 'Judicial Decisions'], 10),
          topic('International Affairs', ['Bilateral Relations', 'International Organizations', 'Global Summits'], 8),
        ], 'National and international current affairs', 7),
        subject('CSAT', [
          topic('Comprehension', ['Reading Comprehension', 'Passage Analysis'], 6),
          topic('Logical Reasoning', ['Syllogisms', 'Seating Arrangement', 'Blood Relations'], 8),
          topic('Quantitative Aptitude', ['Number System', 'Percentage & Ratio', 'Data Interpretation'], 8),
        ], 'Civil Services Aptitude Test - Paper II', 8),
      ], 'Objective type screening test - 2 papers', 1),
      phase('Mains', [
        subject('Essay', [
          topic('Essay Writing', ['Structure & Framework', 'Philosophical Essays', 'Social Issues Essays'], 12),
        ], 'Essay paper - 250 marks', 1),
        subject('General Studies I', [
          topic('Indian Heritage & Culture', ['Art Forms', 'Architecture', 'Literature'], 8),
          topic('Modern Indian History', ['Freedom Struggle', 'Post-Independence Consolidation'], 10),
          topic('World History', ['Industrial Revolution', 'World Wars', 'Decolonization'], 8),
        ], 'GS Paper I - History, Culture, Geography', 2),
        subject('General Studies II', [
          topic('Governance & Constitution', ['Constitutional Bodies', 'Federalism', 'Local Governance'], 10),
          topic('Social Justice', ['Welfare Schemes', 'Vulnerable Sections', 'Health & Education'], 8),
          topic('International Relations', ['India\'s Foreign Policy', 'Bilateral & Multilateral'], 8),
        ], 'GS Paper II - Governance, Constitution, IR', 3),
        subject('General Studies III', [
          topic('Economy & Development', ['Inclusive Growth', 'Infrastructure', 'Investment Models'], 10),
          topic('Security & Disaster Management', ['Internal Security', 'Cyber Security', 'Disaster Management'], 8),
          topic('Science & Technology', ['Indigenous Technology', 'Space & Defence', 'IPR Issues'], 8),
        ], 'GS Paper III - Economy, Security, S&T', 4),
        subject('General Studies IV', [
          topic('Ethics & Integrity', ['Ethical Theories', 'Emotional Intelligence', 'Attitude'], 10),
          topic('Case Studies', ['Administrative Ethics', 'Dilemma Resolution', 'Probity in Governance'], 12),
        ], 'GS Paper IV - Ethics, Integrity, Aptitude', 5),
      ], 'Descriptive written examination - 9 papers', 2),
      phase('Personality Test', [
        subject('Interview Preparation', [
          topic('DAF Based Questions', ['Education Background', 'Work Experience', 'Hobbies'], 8),
          topic('Current Affairs Discussion', ['National Issues', 'International Affairs', 'State-specific'], 10),
          topic('Ethics & Situational', ['Ethical Dilemmas', 'Leadership Scenarios', 'Crisis Management'], 8),
        ], 'Personality Test / Interview - 275 marks', 1),
      ], 'Final stage personality assessment', 3),
    ],
  },
  {
    title: 'BPSC',
    slug: 'bpsc',
    shortDescription: 'Bihar Public Service Commission examination for state civil services and allied posts.',
    fullDescription: 'BPSC conducts the Combined Competitive Examination for recruitment to various administrative posts in Bihar state services including Bihar Administrative Service, Bihar Police Service, and other Group A & B posts.',
    conductingBody: 'Bihar Public Service Commission (BPSC)',
    eligibility: 'Graduate in any discipline. Age 20-37 years (General category).',
    examPattern: 'Prelims (1 paper, MCQ) → Mains (4 papers, descriptive) → Interview',
    importantDates: [
      { label: 'Notification', date: 'March 2026' },
      { label: 'Prelims Exam', date: 'June 2026' },
      { label: 'Mains Exam', date: 'October 2026' },
    ],
    phases: [
      phase('Prelims', [
        subject('Bihar History', [
          topic('Ancient Bihar', ['Magadha Empire', 'Mauryan & Gupta Period', 'Nalanda & Vikramshila'], 6),
          topic('Medieval Bihar', ['Pala Dynasty', 'Sur Dynasty', 'Bhakti Movement in Bihar'], 5),
          topic('Modern Bihar', ['Champaran Satyagraha', 'Freedom Movement in Bihar', 'Post-Independence Bihar'], 6),
        ], 'History of Bihar from ancient to modern', 1),
        subject('Bihar Geography', [
          topic('Physical Features', ['Rivers of Bihar', 'Soils & Climate', 'Natural Resources'], 5),
          topic('Administrative Geography', ['Districts & Divisions', 'Demographics', 'Urbanization'], 4),
          topic('Economic Geography', ['Agriculture', 'Industries', 'Mineral Resources'], 5),
        ], 'Geography of Bihar state', 2),
        subject('General Studies', [
          topic('Indian History', ['Ancient to Modern India', 'Freedom Struggle'], 8),
          topic('Indian Geography', ['Physical & Economic Geography'], 6),
          topic('General Science', ['Physics, Chemistry, Biology Basics'], 5),
        ], 'General Studies for BPSC Prelims', 3),
        subject('Indian Polity', [
          topic('Constitution', ['Fundamental Rights', 'Parliament', 'State Legislature'], 7),
          topic('Governance', ['Panchayati Raj', 'Local Self Government', 'Constitutional Bodies'], 5),
        ], 'Indian Constitution and governance', 4),
        subject('Economy', [
          topic('Indian Economy', ['Economic Planning', 'Banking & Finance', 'Agriculture'], 6),
          topic('Bihar Economy', ['State Budget', 'Development Schemes', 'Industrial Policy'], 5),
        ], 'Indian and Bihar economy', 5),
        subject('Current Affairs', [
          topic('National Current Affairs', ['Government Schemes', 'Important Appointments'], 8),
          topic('Bihar Current Affairs', ['State Government Schemes', 'Bihar-specific News'], 8),
        ], 'National and Bihar current affairs', 6),
      ], 'Objective screening test', 1),
      phase('Mains', [
        subject('General Hindi', [
          topic('Essay & Precis', ['Essay Writing', 'Precis Writing', 'Grammar'], 10),
        ], 'Hindi language paper', 1),
        subject('General Studies Paper I', [
          topic('History & Culture', ['Indian History', 'Bihar History & Culture'], 12),
          topic('Geography', ['Indian & Bihar Geography'], 10),
        ], 'GS Paper I - History, Geography, Culture', 2),
        subject('General Studies Paper II', [
          topic('Polity & Governance', ['Indian Constitution', 'Public Administration'], 12),
          topic('Economy & Social Issues', ['Indian Economy', 'Social Justice'], 10),
        ], 'GS Paper II - Polity, Economy, Social Issues', 3),
      ], 'Descriptive written examination', 2),
      phase('Interview', [
        subject('Personality Test', [
          topic('Personal Background', ['Education', 'Work Experience', 'Hobbies'], 6),
          topic('Bihar Specific', ['State Issues', 'Local Governance', 'Development Challenges'], 8),
          topic('Current Affairs', ['National & State Affairs'], 8),
        ], 'Final personality assessment', 1),
      ], 'Interview stage', 3),
    ],
  },
  {
    title: 'UPPSC',
    slug: 'uppsc',
    shortDescription: 'Uttar Pradesh Public Service Commission examination for state administrative services.',
    fullDescription: 'UPPSC conducts the Provincial Civil Services (PCS) examination for recruitment to various Group A and Group B posts in Uttar Pradesh including PCS, ACF, and other allied services.',
    conductingBody: 'Uttar Pradesh Public Service Commission (UPPSC)',
    eligibility: 'Graduate in any discipline. Age 21-40 years (General category).',
    examPattern: 'Prelims (2 papers) → Mains (8 papers) → Interview',
    importantDates: [
      { label: 'Notification', date: 'April 2026' },
      { label: 'Prelims Exam', date: 'July 2026' },
      { label: 'Mains Exam', date: 'November 2026' },
    ],
    phases: [
      phase('Prelims', [
        subject('Uttar Pradesh History', [
          topic('Ancient UP', ['Vedic Period', 'Mauryan & Gupta Influence', 'Buddhist Sites'], 6),
          topic('Medieval UP', ['Delhi Sultanate in UP', 'Mughal Period', 'Awadh Kingdom'], 6),
          topic('Modern UP', ['1857 Revolt in UP', 'Freedom Movement', 'Post-Independence UP'], 6),
        ], 'History of Uttar Pradesh', 1),
        subject('Uttar Pradesh Geography', [
          topic('Physical Geography', ['Rivers (Ganga, Yamuna)', 'Climate & Soils', 'Forests'], 5),
          topic('Human Geography', ['Districts & Divisions', 'Demographics', 'Urban Centers'], 5),
          topic('Economic Geography', ['Agriculture', 'Industries', 'Tourism'], 5),
        ], 'Geography of Uttar Pradesh', 2),
        subject('General Studies', [
          topic('Indian History & Culture', ['Ancient to Modern India'], 8),
          topic('Indian Geography', ['Physical & Economic Geography'], 6),
          topic('General Science', ['Everyday Science Applications'], 5),
        ], 'General Studies for UPPSC Prelims', 3),
        subject('Indian Polity', [
          topic('Constitution & Governance', ['Fundamental Rights', 'Parliament', 'State Government'], 7),
          topic('Local Governance', ['Panchayati Raj', 'Urban Local Bodies'], 4),
        ], 'Indian Constitution and polity', 4),
        subject('Economy', [
          topic('Indian Economy', ['Planning & Development', 'Banking Sector'], 6),
          topic('UP Economy', ['State Budget', 'Industrial Development', 'Agriculture'], 5),
        ], 'Indian and UP economy', 5),
        subject('Current Affairs', [
          topic('National Affairs', ['Government Policies', 'Important Events'], 8),
          topic('UP Current Affairs', ['State Schemes', 'UP-specific News'], 8),
        ], 'National and UP current affairs', 6),
      ], 'Objective screening test - 2 papers', 1),
      phase('Mains', [
        subject('General Hindi', [
          topic('Hindi Language', ['Essay', 'Precis', 'Translation', 'Grammar'], 10),
        ], 'Compulsory Hindi paper', 1),
        subject('General Studies I', [
          topic('History of India', ['Ancient, Medieval, Modern History'], 12),
          topic('Indian National Movement', ['Freedom Struggle', 'Leaders & Movements'], 8),
        ], 'GS Paper I', 2),
        subject('General Studies II', [
          topic('Indian Polity & Governance', ['Constitution', 'Public Administration'], 12),
          topic('Social Justice', ['Welfare Schemes', 'Vulnerable Groups'], 8),
        ], 'GS Paper II', 3),
        subject('General Studies III', [
          topic('Economy & Development', ['Indian Economy', 'UP Development'], 10),
          topic('Science & Technology', ['Recent Developments', 'Environment'], 8),
        ], 'GS Paper III', 4),
      ], 'Descriptive written examination', 2),
      phase('Interview', [
        subject('Personality Test', [
          topic('Personal Interview', ['Background Questions', 'Career Goals'], 6),
          topic('UP Specific Knowledge', ['State Issues', 'Culture & Heritage'], 8),
          topic('Current Affairs', ['National & International'], 8),
        ], 'Final interview stage', 1),
      ], 'Personality test', 3),
    ],
  },
  {
    title: 'SSC CGL',
    slug: 'ssc-cgl',
    shortDescription: 'Staff Selection Commission Combined Graduate Level examination for central government posts.',
    fullDescription: 'SSC CGL is one of the largest recruitment examinations in India for Group B and Group C posts in various ministries and departments of the Government of India including Inspector, Auditor, Accountant, and Assistant posts.',
    conductingBody: 'Staff Selection Commission (SSC)',
    eligibility: 'Graduate in any discipline. Age 18-32 years (varies by post).',
    examPattern: 'Tier 1 (Online MCQ) → Tier 2 (Online MCQ + Descriptive) → Tier 3 (Descriptive) → Tier 4 (Skill Test)',
    importantDates: [
      { label: 'Notification', date: 'January 2026' },
      { label: 'Tier 1 Exam', date: 'April 2026' },
      { label: 'Tier 2 Exam', date: 'August 2026' },
    ],
    phases: [
      phase('Tier 1', [
        subject('Quantitative Aptitude', [
          topic('Number System', ['LCM & HCF', 'Divisibility Rules', 'Unit Digit', 'Remainders'], 6),
          topic('Algebra', ['Linear Equations', 'Quadratic Equations', 'Polynomials', 'Identities'], 8),
          topic('Geometry', ['Triangles', 'Circles', 'Quadrilaterals', 'Mensuration'], 8),
          topic('Trigonometry', ['Ratios & Identities', 'Heights & Distances'], 6),
          topic('Data Interpretation', ['Bar Graphs', 'Pie Charts', 'Tables', 'Line Graphs'], 6),
        ], 'Mathematical aptitude and calculations', 1),
        subject('Reasoning', [
          topic('Verbal Reasoning', ['Analogy', 'Classification', 'Series', 'Coding-Decoding'], 6),
          topic('Non-Verbal Reasoning', ['Figure Series', 'Mirror & Water Images', 'Paper Folding'], 5),
          topic('Puzzles', ['Seating Arrangement', 'Floor Puzzle', 'Box Puzzle', 'Scheduling'], 8),
          topic('Blood Relations', ['Family Tree', 'Coded Relations'], 4),
        ], 'General intelligence and reasoning', 2),
        subject('English', [
          topic('Grammar', ['Tenses', 'Articles', 'Prepositions', 'Subject-Verb Agreement'], 6),
          topic('Vocabulary', ['Synonyms & Antonyms', 'One Word Substitution', 'Idioms & Phrases'], 6),
          topic('Comprehension', ['Reading Passages', 'Cloze Test', 'Para Jumbles'], 6),
          topic('Error Detection', ['Spotting Errors', 'Sentence Improvement'], 4),
        ], 'English language and comprehension', 3),
        subject('General Awareness', [
          topic('History', ['Ancient, Medieval, Modern India'], 6),
          topic('Geography', ['Indian & World Geography'], 5),
          topic('Polity', ['Constitution Basics', 'Important Articles'], 5),
          topic('Economy', ['Basic Economic Concepts', 'Budget & Finance'], 5),
          topic('Science', ['Physics, Chemistry, Biology Basics'], 5),
          topic('Current Affairs', ['Last 6 Months Important Events'], 8),
        ], 'General awareness and current affairs', 4),
      ], 'Online objective test - 100 questions', 1),
      phase('Tier 2', [
        subject('Quantitative Abilities', [
          topic('Advanced Mathematics', ['Algebra', 'Geometry', 'Trigonometry', 'Mensuration'], 15),
          topic('Data Analysis', ['Statistics', 'Data Interpretation', 'Probability'], 10),
        ], 'Advanced quantitative section', 1),
        subject('English Language', [
          topic('Advanced English', ['Essay Writing', 'Letter Writing', 'Precis', 'Grammar Advanced'], 12),
        ], 'English language and comprehension - advanced', 2),
        subject('Statistics', [
          topic('Statistical Methods', ['Mean, Median, Mode', 'Standard Deviation', 'Correlation'], 10),
          topic('Probability', ['Basic Probability', 'Distribution', 'Sampling'], 8),
        ], 'Statistics paper for Statistical Investigator posts', 3),
      ], 'Online descriptive and objective test', 2),
    ],
  },
  {
    title: 'Banking',
    slug: 'banking',
    shortDescription: 'IBPS, SBI and other banking examinations for PO, Clerk, and Specialist Officer posts.',
    fullDescription: 'Banking examinations include IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B, and other specialist officer exams for recruitment to public sector banks and financial institutions across India.',
    conductingBody: 'IBPS / State Bank of India (SBI)',
    eligibility: 'Graduate in any discipline. Age 20-30 years (varies by exam).',
    examPattern: 'Prelims (MCQ) → Mains (MCQ + Descriptive) → Interview (for PO)',
    importantDates: [
      { label: 'IBPS PO Notification', date: 'August 2026' },
      { label: 'Prelims Exam', date: 'October 2026' },
      { label: 'Mains Exam', date: 'November 2026' },
    ],
    phases: [
      phase('Prelims', [
        subject('Quantitative Aptitude', [
          topic('Number Series', ['Missing Number', 'Wrong Number Series'], 4),
          topic('Simplification', ['BODMAS', 'Approximation', 'Surds & Indices'], 5),
          topic('Data Interpretation', ['Bar Graph', 'Pie Chart', 'Tabular DI', 'Caselet DI'], 8),
          topic('Arithmetic', ['Percentage', 'Profit & Loss', 'SI & CI', 'Time & Work', 'Ratio & Proportion'], 10),
          topic('Algebra', ['Linear Equations', 'Quadratic Equations'], 5),
        ], 'Mathematical aptitude for banking', 1),
        subject('Reasoning Ability', [
          topic('Puzzles', ['Seating Arrangement (Linear & Circular)', 'Floor Puzzle', 'Box Puzzle', 'Scheduling Puzzle'], 10),
          topic('Syllogism', ['Traditional & New Pattern Syllogism'], 4),
          topic('Inequality', ['Coded Inequality', 'Mathematical Inequality'], 4),
          topic('Blood Relations', ['Simple & Coded Relations'], 3),
          topic('Direction Sense', ['Direction & Distance Problems'], 3),
          topic('Input-Output', ['Word & Number Arrangement Machine'], 4),
        ], 'Logical reasoning for banking exams', 2),
        subject('English Language', [
          topic('Reading Comprehension', ['Story Based RC', 'Banking/Economy Based RC'], 6),
          topic('Cloze Test', ['Single & Double Fillers'], 4),
          topic('Error Spotting', ['Grammar Errors', 'Sentence Correction'], 4),
          topic('Para Jumbles', ['Sentence Rearrangement'], 3),
          topic('Vocabulary', ['Word Usage', 'Phrase Replacement'], 3),
        ], 'English language proficiency', 3),
      ], 'Online objective screening test', 1),
      phase('Mains', [
        subject('Reasoning & Computer Aptitude', [
          topic('Advanced Puzzles', ['Complex Seating', 'Multi-variable Puzzles'], 8),
          topic('Logical Reasoning', ['Statement & Assumption', 'Course of Action', 'Cause & Effect'], 6),
          topic('Computer Awareness', ['Hardware & Software', 'MS Office', 'Internet & Networking', 'Cyber Security Basics'], 6),
        ], 'Advanced reasoning and computer knowledge', 1),
        subject('Data Analysis & Interpretation', [
          topic('Advanced DI', ['Missing DI', 'Radar Chart', 'Mixed DI'], 10),
          topic('Data Sufficiency', ['Two Statement DS', 'Three Statement DS'], 5),
          topic('Quantity Comparison', ['Quadratic Comparison', 'Number Comparison'], 4),
        ], 'Advanced quantitative and data analysis', 2),
        subject('English Language', [
          topic('Descriptive English', ['Essay Writing', 'Letter Writing (Formal & Informal)', 'Precis Writing'], 8),
          topic('Advanced Grammar', ['Sentence Connectors', 'Word Swap', 'Starters'], 5),
        ], 'English language - mains level', 3),
        subject('General/Economy/Banking Awareness', [
          topic('Banking Awareness', ['RBI Functions', 'Types of Accounts', 'NPA & Basel Norms', 'Monetary Policy'], 10),
          topic('Financial Awareness', ['Budget & Economic Survey', 'Financial Institutions', 'Stock Market Basics'], 8),
          topic('Static GK', ['Countries & Capitals', 'Important Days', 'Awards & Honours'], 5),
          topic('Current Affairs', ['Banking News', 'Government Schemes', 'Appointments'], 10),
        ], 'General, economy and banking awareness', 4),
      ], 'Online objective + descriptive test', 2),
      phase('Interview', [
        subject('Banking Interview', [
          topic('Personal Questions', ['Tell me about yourself', 'Why banking?', 'Strengths & Weaknesses'], 5),
          topic('Banking Knowledge', ['RBI Role', 'Banking Terms', 'Recent Banking News'], 8),
          topic('Current Affairs', ['Economy & Finance News', 'Government Policies'], 6),
          topic('Situational Questions', ['Customer Handling', 'Ethical Dilemmas', 'Team Management'], 5),
        ], 'Personal interview for PO posts', 1),
      ], 'Interview for Probationary Officer posts', 3),
    ],
  },
];

export default examSeedData;
