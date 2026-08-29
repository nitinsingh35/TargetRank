import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateBankingQuestions = async (count = 10, examId) => {
  const query = { tags: 'Banking' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'What is the full form of RTGS in banking transactions?',
      options: ['Real Time Gross Settlement', 'Real Time General Settlement', 'Rapid Transfer Gross Settlement', 'Running Time Gross Settlement'],
      correctAnswer: 'Real Time Gross Settlement',
      explanation: 'RTGS stands for Real Time Gross Settlement, a continuous and real-time settlement of fund transfers individually on a transaction-by-transaction basis.',
      difficulty: 'easy',
      marks: 1,
      negativeMarks: 0.25,
      tags: ['Banking terms', 'RTGS'],
    },
    {
      questionText: 'Which rate is the rate at which RBI lends short-term money to commercial banks against government securities?',
      options: ['Repo Rate', 'Reverse Repo Rate', 'Bank Rate', 'Marginal Standing Facility Rate'],
      correctAnswer: 'Repo Rate',
      explanation: 'Repo rate (Repurchase Option) is the rate at which the RBI lends money to commercial banks against securities in case of shortage of funds.',
      difficulty: 'easy',
      marks: 1,
      negativeMarks: 0.25,
      tags: ['RBI policy', 'Banking Awareness'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Under standard RBI directives and guidelines: "${fact.factText}". What is correct?`,
        options: ['Verified and correct', 'Applicable only to cooperative banks', 'Stands suspended under Basel III guidelines', 'Regulated by Ministry of Commerce'],
        correctAnswer: 'Verified and correct',
        explanation: `Banking fact reference: ${fact.sourceReference || 'RBI Circulars'}.`,
        difficulty: 'medium',
        marks: 1,
        negativeMarks: 0.25,
        tags: fact.tags || ['Banking Awareness'],
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
