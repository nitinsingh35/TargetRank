import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateHistoryQuestions = async (count = 10, examId) => {
  const query = { tags: 'History' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'Who was the governor general of India during the Revolt of 1857?',
      options: ['Lord Canning', 'Lord Dalhousie', 'Lord Elgin', 'Lord Lawrence'],
      correctAnswer: 'Lord Canning',
      explanation: 'Lord Canning was the Governor-General of India during the Revolt of 1857 and became the first Viceroy after the Government of India Act 1858.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Revolt of 1857', 'Modern History'],
    },
    {
      questionText: 'The famous Harappan site of Kalibangan is located in which modern state of India?',
      options: ['Rajasthan', 'Gujarat', 'Haryana', 'Punjab'],
      correctAnswer: 'Rajasthan',
      explanation: 'Kalibangan is a Harappan site famous for ploughed field findings, located in Hanumangarh district of Rajasthan.',
      difficulty: 'medium',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Indus Valley Civilisation', 'Ancient History'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Consider the following historical statement: "${fact.factText}". Which of the following is correct?`,
        options: ['It is a historically verified event', 'It was a myth recorded in Puranas', 'It was refuted by modern archaeological reports', 'It is only applicable to the Mughal administration'],
        correctAnswer: 'It is a historically verified event',
        explanation: `Historical reference: ${fact.sourceReference || 'Ancient Inscriptions'}.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        tags: fact.tags || ['History'],
      };
    } else {
      item = fallbacks[i % fallbacks.length];
    }

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
