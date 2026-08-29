/**
 * Configurable Starter Exam Pattern Templates for Mock Tests.
 * NOTE: These are admin defaults and editable configurations, not strict claims.
 * They are used to pre-fill admin mock test creation forms.
 */
export const mockExamPatterns = [
  {
    id: 'upsc_prelims_gs1',
    name: 'UPSC Prelims GS Paper I',
    examName: 'UPSC',
    durationMinutes: 120,
    totalQuestions: 100,
    totalMarks: 200,
    negativeMarkingEnabled: true,
    defaultNegativeMarks: 0.66,
    passingMarks: 66,
    category: 'full_length',
    sections: [
      { name: 'History and Culture', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0.66, order: 1 },
      { name: 'Geography', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0.66, order: 2 },
      { name: 'Indian Polity', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0.66, order: 3 },
      { name: 'Economy', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0.66, order: 4 },
      { name: 'Environment and Ecology', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0.66, order: 5 },
      { name: 'Science and Technology', questionCount: 10, marksPerQuestion: 2, negativeMarks: 0.66, order: 6 },
      { name: 'Current Affairs', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0.66, order: 7 }
    ]
  },
  {
    id: 'bpsc_prelims',
    name: 'BPSC Prelims',
    examName: 'BPSC',
    durationMinutes: 120,
    totalQuestions: 150,
    totalMarks: 150,
    negativeMarkingEnabled: true,
    defaultNegativeMarks: 0.33,
    passingMarks: 60,
    category: 'full_length',
    sections: [
      { name: 'History', questionCount: 30, marksPerQuestion: 1, negativeMarks: 0.33, order: 1 },
      { name: 'Bihar Special', questionCount: 25, marksPerQuestion: 1, negativeMarks: 0.33, order: 2 },
      { name: 'Current Affairs', questionCount: 25, marksPerQuestion: 1, negativeMarks: 0.33, order: 3 },
      { name: 'General Science', questionCount: 30, marksPerQuestion: 1, negativeMarks: 0.33, order: 4 },
      { name: 'Geography', questionCount: 15, marksPerQuestion: 1, negativeMarks: 0.33, order: 5 },
      { name: 'Polity', questionCount: 10, marksPerQuestion: 1, negativeMarks: 0.33, order: 6 },
      { name: 'Economy', questionCount: 10, marksPerQuestion: 1, negativeMarks: 0.33, order: 7 },
      { name: 'General Mental Ability', questionCount: 5, marksPerQuestion: 1, negativeMarks: 0.33, order: 8 }
    ]
  },
  {
    id: 'jpsc_prelims_paper1',
    name: 'JPSC Prelims Paper I (General Studies)',
    examName: 'JPSC',
    durationMinutes: 120,
    totalQuestions: 100,
    totalMarks: 200,
    negativeMarkingEnabled: false,
    defaultNegativeMarks: 0,
    passingMarks: 80,
    category: 'full_length',
    sections: [
      { name: 'History of India', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0, order: 1 },
      { name: 'Geography of India', questionCount: 10, marksPerQuestion: 2, negativeMarks: 0, order: 2 },
      { name: 'Indian Polity and Governance', questionCount: 10, marksPerQuestion: 2, negativeMarks: 0, order: 3 },
      { name: 'Economic and Sustainable Development', questionCount: 10, marksPerQuestion: 2, negativeMarks: 0, order: 4 },
      { name: 'Science and Technology', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0, order: 5 },
      { name: 'Jharkhand Specific Questions', questionCount: 10, marksPerQuestion: 2, negativeMarks: 0, order: 6 },
      { name: 'National & International Current Events', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0, order: 7 },
      { name: 'Miscellaneous Questions of General Nature', questionCount: 15, marksPerQuestion: 2, negativeMarks: 0, order: 8 }
    ]
  },
  {
    id: 'uppsc_prelims',
    name: 'UPPSC Prelims GS Paper I',
    examName: 'UPPSC',
    durationMinutes: 120,
    totalQuestions: 150,
    totalMarks: 200,
    negativeMarkingEnabled: true,
    defaultNegativeMarks: 0.44, // 1.33 marks per question, negative is 1/3 i.e. 0.44
    passingMarks: 66,
    category: 'full_length',
    sections: [
      { name: 'History of India', questionCount: 25, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 1 },
      { name: 'Geography & World Geography', questionCount: 20, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 2 },
      { name: 'Polity and Governance', questionCount: 20, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 3 },
      { name: 'Economic and Social Development', questionCount: 15, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 4 },
      { name: 'Science and Technology', questionCount: 25, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 5 },
      { name: 'Environment and Ecology', questionCount: 15, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 6 },
      { name: 'Uttar Pradesh Special', questionCount: 10, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 7 },
      { name: 'Current Affairs', questionCount: 20, marksPerQuestion: 1.33, negativeMarks: 0.44, order: 8 }
    ]
  },
  {
    id: 'ssc_cgl_tier1',
    name: 'SSC CGL Tier I',
    examName: 'SSC CGL',
    durationMinutes: 60,
    totalQuestions: 100,
    totalMarks: 200,
    negativeMarkingEnabled: true,
    defaultNegativeMarks: 0.5,
    passingMarks: 70,
    category: 'full_length',
    sections: [
      { name: 'General Intelligence and Reasoning', questionCount: 25, marksPerQuestion: 2, negativeMarks: 0.5, order: 1 },
      { name: 'General Awareness', questionCount: 25, marksPerQuestion: 2, negativeMarks: 0.5, order: 2 },
      { name: 'Quantitative Aptitude', questionCount: 25, marksPerQuestion: 2, negativeMarks: 0.5, order: 3 },
      { name: 'English Comprehension', questionCount: 25, marksPerQuestion: 2, negativeMarks: 0.5, order: 4 }
    ]
  },
  {
    id: 'banking_prelims',
    name: 'Banking Prelims (SBI/IBPS PO)',
    examName: 'Banking',
    durationMinutes: 60,
    totalQuestions: 100,
    totalMarks: 100,
    negativeMarkingEnabled: true,
    defaultNegativeMarks: 0.25,
    passingMarks: 45,
    category: 'full_length',
    sections: [
      { name: 'English Language', questionCount: 30, marksPerQuestion: 1, negativeMarks: 0.25, order: 1, durationMinutes: 20 },
      { name: 'Quantitative Aptitude', questionCount: 35, marksPerQuestion: 1, negativeMarks: 0.25, order: 2, durationMinutes: 20 },
      { name: 'Reasoning Ability', questionCount: 35, marksPerQuestion: 1, negativeMarks: 0.25, order: 3, durationMinutes: 20 }
    ]
  },
  {
    id: 'railway_ntpc_stage1',
    name: 'Railway NTPC CBT-1',
    examName: 'Railway',
    durationMinutes: 90,
    totalQuestions: 100,
    totalMarks: 100,
    negativeMarkingEnabled: true,
    defaultNegativeMarks: 0.33,
    passingMarks: 40,
    category: 'full_length',
    sections: [
      { name: 'General Awareness', questionCount: 40, marksPerQuestion: 1, negativeMarks: 0.33, order: 1 },
      { name: 'Mathematics', questionCount: 30, marksPerQuestion: 1, negativeMarks: 0.33, order: 2 },
      { name: 'General Intelligence and Reasoning', questionCount: 30, marksPerQuestion: 1, negativeMarks: 0.33, order: 3 }
    ]
  },
  {
    id: 'defence_general_test',
    name: 'Defence General Competitive Test',
    examName: 'Defence',
    durationMinutes: 120,
    totalQuestions: 100,
    totalMarks: 100,
    negativeMarkingEnabled: true,
    defaultNegativeMarks: 0.25,
    passingMarks: 40,
    category: 'full_length',
    sections: [
      { name: 'General Knowledge', questionCount: 20, marksPerQuestion: 1, negativeMarks: 0.25, order: 1 },
      { name: 'English', questionCount: 20, marksPerQuestion: 1, negativeMarks: 0.25, order: 2 },
      { name: 'Mathematics', questionCount: 20, marksPerQuestion: 1, negativeMarks: 0.25, order: 3 },
      { name: 'Reasoning', questionCount: 20, marksPerQuestion: 1, negativeMarks: 0.25, order: 4 },
      { name: 'Science', questionCount: 20, marksPerQuestion: 1, negativeMarks: 0.25, order: 5 }
    ]
  }
];
