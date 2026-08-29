import FactBank from '../../models/FactBank.js';
import { validateMCQ } from './validators.js';

export const generateEnvironmentQuestions = async (count = 10, examId) => {
  const query = { tags: 'Environment' };
  if (examId) query.examId = examId;
  const facts = await FactBank.find(query);

  const fallbacks = [
    {
      questionText: 'In which year was the Wildlife (Protection) Act enacted in India?',
      options: ['1972', '1980', '1986', '1992'],
      correctAnswer: '1972',
      explanation: 'The Wildlife (Protection) Act was enacted in 1972 to provide safety to wild animals, birds, and plants across the country.',
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Wildlife Protection', 'Ecology Laws'],
    },
    {
      questionText: 'Which ecological term defines the transition zone between two distinct biomes?',
      options: ['Ecotone', 'Ecosphere', 'Ecological Niche', 'Ecocline'],
      correctAnswer: 'Ecotone',
      explanation: 'An ecotone is a region of transition between two biological communities (e.g. estuary between fresh water and salt water, or marshland between dry land and water).',
      difficulty: 'medium',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Ecosystems', 'Environment'],
    }
  ];

  const generated = [];
  const sourceCount = facts.length;

  for (let i = 0; i < count; i++) {
    let item;
    if (sourceCount > 0 && i < sourceCount) {
      const fact = facts[i];
      item = {
        questionText: `Based on ecological and environmental studies: "${fact.factText}". Which is correct?`,
        options: ['It is a verified ecological fact', 'It represents a food web exception', 'It has been declared an invasive threat', 'It was resolved under Kyoto Protocol'],
        correctAnswer: 'It is a verified ecological fact',
        explanation: `Fact bank source: ${fact.sourceReference || 'Ecology Bulletins'}.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.66,
        tags: fact.tags || ['Environment'],
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
