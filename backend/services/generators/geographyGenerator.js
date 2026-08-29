import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateGeographyQuestions = async (count = 10, examId) => {
  const query = { tags: 'Geography' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'Which of the following passes connects Srinagar to Leh?',
      options: ['Zoji La Pass', 'Bara-lacha La Pass', 'Shipki La Pass', 'Rohtang Pass'],
      correctAnswer: 'Zoji La Pass',
      explanation: 'Zoji La is a high mountain pass in the Himalayas, connecting Srinagar and Leh on National Highway 1D.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Mountain Passes', 'Indian Geography'],
    },
    {
      questionText: 'Which of the following rivers is known as the "Sorrow of Bengal"?',
      options: ['Damodar River', 'Kosi River', 'Gandak River', 'Hooghly River'],
      correctAnswer: 'Damodar River',
      explanation: 'The Damodar River was historically known as the "Sorrow of Bengal" due to its devastating floods, before the construction of dams by the DVC.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['River Systems', 'Geography'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Which of the following is correct regarding this geographical feature: "${fact.factText}"?`,
        options: ['Verified and correct', 'It is located in South America', 'It is an active volcanic peak', 'It is a cold desert valley'],
        correctAnswer: 'Verified and correct',
        explanation: `Geography fact source: ${fact.sourceReference || 'Geological Reports'}.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        tags: fact.tags || ['Geography'],
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
