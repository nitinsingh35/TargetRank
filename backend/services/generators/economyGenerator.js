import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateEconomyQuestions = async (count = 10, examId) => {
  const query = { tags: 'Economy' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'Which body is responsible for formulation of Monetary Policy in India?',
      options: ['Monetary Policy Committee (RBI)', 'Ministry of Finance', 'NITI Aayog', 'Securities and Exchange Board of India'],
      correctAnswer: 'Monetary Policy Committee (RBI)',
      explanation: 'The Monetary Policy Committee (MPC) of the Reserve Bank of India (RBI) is responsible for fixing the benchmark interest rates (repo rate) to keep inflation under control.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['RBI', 'Monetary Policy'],
    },
    {
      questionText: 'Which index is primarily used by the RBI to measure inflation for monetary policy decisions?',
      options: ['Consumer Price Index (CPI)', 'Wholesale Price Index (WPI)', 'Gross Domestic Product Deflator', 'Index of Industrial Production'],
      correctAnswer: 'Consumer Price Index (CPI)',
      explanation: 'RBI shifted to Consumer Price Index (CPI) Combined as the key measure of inflation for target setting based on the Urjit Patel Committee recommendations.',
      difficulty: 'medium',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Inflation', 'Economy Indices'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Which of the following is correct regarding this economic fact: "${fact.factText}"?`,
        options: ['Verified and correct', 'It leads to instant deflation', 'It is monitored by IMF exclusively', 'It was abolished under GST reforms'],
        correctAnswer: 'Verified and correct',
        explanation: `Fact bank source: ${fact.sourceReference || 'Economic Survey of India'}.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        tags: fact.tags || ['Economy'],
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
