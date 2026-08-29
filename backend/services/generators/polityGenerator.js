import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generatePolityQuestions = async (count = 10, examId) => {
  // Query FactBank for Polity facts
  const query = { tags: 'Polity' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'Under the Indian Constitution, the idea of "Directive Principles of State Policy" is borrowed from the constitution of which country?',
      options: ['Ireland', 'United States', 'Australia', 'Canada'],
      correctAnswer: 'Ireland',
      explanation: 'Directive Principles of State Policy (DPSP) are borrowed from the Irish Constitution and listed under Part IV (Articles 36 to 51) of the Indian Constitution.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['DPSP', 'Polity Sources'],
    },
    {
      questionText: 'Which constitutional amendment added the fundamental duties to the Constitution of India?',
      options: ['42nd Amendment Act', '44th Amendment Act', '86th Amendment Act', '52nd Amendment Act'],
      correctAnswer: '42nd Amendment Act',
      explanation: 'The 42nd Constitutional Amendment Act of 1976 added Part IV-A and Article 51A specifying Fundamental Duties, based on the Swaran Singh Committee recommendations.',
      difficulty: 'medium',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Fundamental Duties', 'Amendments'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Which of the following is correct regarding this constitutional provision: "${fact.factText}"?`,
        options: ['Verified and correct as stated', 'Violates basic structures', 'Repealed by 44th Amendment', 'Applicable only to Union Territories'],
        correctAnswer: 'Verified and correct as stated',
        explanation: `Fact reference: ${fact.sourceReference || 'Constitutional Assembly Records'}.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        tags: fact.tags || ['Polity'],
      };
    } else {
      // Fallback
      item = fallbacks[i % fallbacks.length];
    }

    // Shuffle options
    const shuffledOptions = [...item.options];
    for (let k = shuffledOptions.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [shuffledOptions[k], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[k]];
    }
    item.options = shuffledOptions;

    const err = validateMCQ(item);
    if (!err) generated.push(item);
  }

  return generated;
};
