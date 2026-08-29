import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateScienceQuestions = async (count = 10, examId) => {
  const query = { tags: 'Science' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'Which element is present in chlorophyll and responsible for light absorption in plants?',
      options: ['Magnesium', 'Iron', 'Zinc', 'Calcium'],
      correctAnswer: 'Magnesium',
      explanation: 'Chlorophyll molecules contain a central magnesium atom surrounded by a porphyrin ring, which is crucial for absorbing sunlight during photosynthesis.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Biology', 'Plant Physiology'],
    },
    {
      questionText: 'What is the speed of light in vacuum?',
      options: ['299,792,458 m/s', '150,000,000 m/s', '343 m/s', '30,000 m/s'],
      correctAnswer: '299,792,458 m/s',
      explanation: 'The speed of light in a vacuum is exactly 299,792,458 meters per second (approx. 3 x 10^8 m/s).',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Physics', 'General Science'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Which of the following is correct regarding this scientific discovery: "${fact.factText}"?`,
        options: ['Verified and scientifically correct', 'Refuted by quantum studies', 'Applicable only to thermodynamics', 'Requires absolute zero to execute'],
        correctAnswer: 'Verified and scientifically correct',
        explanation: `Science fact source: ${fact.sourceReference || 'Science Journals'}.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        tags: fact.tags || ['Science'],
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
