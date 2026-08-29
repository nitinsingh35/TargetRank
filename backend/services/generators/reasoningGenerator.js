import { validateMCQ } from './validators.js';

export const generateReasoningQuestions = (count = 10) => {
  const templates = [
    // Coding-Decoding
    () => {
      const words = [
        { word: 'ORANGE', key: 'PUZOHF' },
        { word: 'TEMPLE', key: 'UFNQMF' },
        { word: 'GARDEN', key: 'HBSDFO' }
      ];
      const selected = words[Math.floor(Math.random() * words.length)];

      const questionText = `In a certain code language, if 'FLOWER' is coded as 'GMPXFS', how would '${selected.word}' be coded in that same language?`;
      
      const correctAnswer = selected.key;
      const wrong1 = selected.key.split('').reverse().join('');
      const wrong2 = selected.key.replace(/A/g, 'Z').replace(/B/g, 'Y');
      const wrong3 = selected.key.substring(1) + 'A';

      return {
        questionText,
        options: [correctAnswer, wrong1, wrong2, wrong3],
        correctAnswer,
        explanation: `The coding rule adds +1 position shift to each character of the word:\nF + 1 = G\nL + 1 = M\nO + 1 = P\nW + 1 = X\nE + 1 = F\nR + 1 = S\nApplying the same rule to '${selected.word}' yields '${selected.key}'.`,
        difficulty: 'easy',
        marks: 2,
        negativeMarks: 0.5,
        tags: ['Coding Decoding', 'Reasoning'],
      };
    },

    // Number Series
    () => {
      const start = Math.floor(Math.random() * 5) + 3; // 3 to 7
      const multiplier = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const series = [start];
      for (let s = 1; s < 5; s++) {
        series.push(series[s - 1] * multiplier + 1);
      }
      const nextTerm = series[series.length - 1] * multiplier + 1;

      const questionText = `Look at this series: ${series.join(', ')}, ... What number should come next in the sequence?`;

      const correctAnswer = `${nextTerm}`;
      const wrong1 = `${nextTerm + 10}`;
      const wrong2 = `${nextTerm - 5}`;
      const wrong3 = `${nextTerm * 2}`;

      return {
        questionText,
        options: [correctAnswer, wrong1, wrong2, wrong3],
        correctAnswer,
        explanation: `Each consecutive term in the sequence is calculated by multiplying the previous term by ${multiplier} and adding 1:\nFormula: (Term * ${multiplier}) + 1.\n${series[0]} * ${multiplier} + 1 = ${series[1]},\n${series[1]} * ${multiplier} + 1 = ${series[2]},\nApplying this to the last term: ${series[series.length - 1]} * ${multiplier} + 1 = ${nextTerm}.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.5,
        tags: ['Number Series', 'Logical Reasoning'],
      };
    }
  ];

  const generated = [];
  for (let i = 0; i < count; i++) {
    const tmplIndex = i % templates.length;
    const item = templates[tmplIndex]();
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
