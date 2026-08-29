import { validateMCQ } from './validators.js';

export const generateEnglishQuestions = (count = 10) => {
  const templates = [
    // Error Spotting
    () => {
      const questionText = `Find the part of the sentence which contains a grammatical error:\n"Neither of the two candidates (A) / are fit for (B) / the post of (C) / Project Manager. (D)"`;
      
      const correctAnswer = 'are fit for (B)';
      const wrong1 = 'Neither of the two candidates (A)';
      const wrong2 = 'the post of (C)';
      const wrong3 = 'Project Manager. (D)';

      return {
        questionText,
        options: [correctAnswer, wrong1, wrong2, wrong3],
        correctAnswer,
        explanation: `The singular pronoun 'Neither' is always followed by a singular verb. Therefore, 'are fit for' must be corrected to 'is fit for' to resolve subject-verb agreement.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.5,
        tags: ['Error Spotting', 'English Grammar'],
      };
    },

    // Synonyms
    () => {
      const vocab = [
        { word: 'ABANDON', syn: 'Forsake', wrong: ['Retain', 'Acquire', 'Protect'] },
        { word: 'BENEVOLENT', syn: 'Kind-hearted', wrong: ['Hostile', 'Miserly', 'Avaricious'] },
        { word: 'EPHEMERAL', syn: 'Transient', wrong: ['Permanent', 'Eternal', 'Enduring'] }
      ];
      const item = vocab[Math.floor(Math.random() * vocab.length)];

      const questionText = `Choose the word which is most nearly the SAME in meaning to the given word in capital letters:\n\n${item.word}`;

      const correctAnswer = item.syn;
      const wrong1 = item.wrong[0];
      const wrong2 = item.wrong[1];
      const wrong3 = item.wrong[2];

      return {
        questionText,
        options: [correctAnswer, wrong1, wrong2, wrong3],
        correctAnswer,
        explanation: `'${item.word}' means lasting for a very short time or being kind/deserted. The closest synonym is '${item.syn}'.`,
        difficulty: 'easy',
        marks: 2,
        negativeMarks: 0.5,
        tags: ['Synonyms', 'English Vocabulary'],
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
