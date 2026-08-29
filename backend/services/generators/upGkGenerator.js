import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateUPQuestions = async (count = 10, examId) => {
  const query = { tags: 'UP' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'In which city is the famous Bara Imambara located in Uttar Pradesh?',
      options: ['Lucknow', 'Agra', 'Varanasi', 'Kanpur'],
      correctAnswer: 'Lucknow',
      explanation: 'The Bara Imambara is an imambara complex in Lucknow, Uttar Pradesh, built by Asaf-ud-Daula, Nawab of Awadh, in 1784.',
      difficulty: 'easy',
      marks: 1,
      negativeMarks: 0.25,
      tags: ['UP Culture', 'UP History'],
    },
    {
      questionText: 'Which district of Uttar Pradesh shares its boundaries with four different states?',
      options: ['Sonbhadra', 'Saharanpur', 'Jhansi', 'Lalitpur'],
      correctAnswer: 'Sonbhadra',
      explanation: 'Sonbhadra district in Uttar Pradesh shares its borders with Bihar, Jharkhand, Chhattisgarh, and Madhya Pradesh, which is unique in India.',
      difficulty: 'medium',
      marks: 1,
      negativeMarks: 0.25,
      tags: ['UP Boundaries', 'UP Geography'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Concerning Uttar Pradesh GK: "${fact.factText}". Which is correct?`,
        options: ['It is a historically verified event/statistic', 'It was declared a Ramsar site in 2022', 'It represents a state bird notification', 'It is located along the Gandak river bank'],
        correctAnswer: 'It is a historically verified event/statistic',
        explanation: `UP GK fact reference: ${fact.sourceReference || 'UP Gazettes'}.`,
        difficulty: 'medium',
        marks: 1,
        negativeMarks: 0.25,
        tags: fact.tags || ['UP GK'],
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
