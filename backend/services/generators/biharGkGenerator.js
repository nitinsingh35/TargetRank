import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateBiharQuestions = async (count = 10, examId) => {
  const query = { tags: 'Bihar' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'Who was selected by Mahatma Gandhi to lead the Champaran Satyagraha in Bihar in 1917?',
      options: ['Raj Kumar Shukla', 'Rajendra Prasad', 'Anugrah Narayan Sinha', 'J.B. Kripalani'],
      correctAnswer: 'Raj Kumar Shukla',
      explanation: 'Raj Kumar Shukla was the indigo cultivator who persuaded Mahatma Gandhi to visit Champaran to look into the grievances of the farmers under the Tinkathia system.',
      difficulty: 'easy',
      marks: 1,
      negativeMarks: 0.25,
      tags: ['Champaran Satyagraha', 'Bihar Freedom Struggle'],
    },
    {
      questionText: 'Which district of Bihar has the highest literacy rate as per Census 2011?',
      options: ['Rohtas', 'Patna', 'Munger', 'Gaya'],
      correctAnswer: 'Rohtas',
      explanation: 'As per Census 2011, Rohtas district has the highest literacy rate in Bihar at 73.37%.',
      difficulty: 'medium',
      marks: 1,
      negativeMarks: 0.25,
      tags: ['Bihar Census', 'Bihar Geography'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Concerning Bihar GK: "${fact.factText}". Which is correct?`,
        options: ['It is a historically verified event/statistic', 'It was declared a Ramsar site in 2022', 'It represents a state bird notification', 'It is located along the Gandak river bank'],
        correctAnswer: 'It is a historically verified event/statistic',
        explanation: `Bihar GK fact reference: ${fact.sourceReference || 'Bihar Gazettes'}.`,
        difficulty: 'medium',
        marks: 1,
        negativeMarks: 0.25,
        tags: fact.tags || ['Bihar GK'],
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
