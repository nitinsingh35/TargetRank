export const validateMCQ = (question) => {
  const { questionText, options, correctAnswer, explanation } = question;

  if (!questionText || questionText.trim().length < 10) {
    return 'Question text must be at least 10 characters long.';
  }

  if (!options || options.length !== 4) {
    return 'MCQ must have exactly 4 options.';
  }

  // Duplicate check on options
  const uniqueOptions = new Set(options.map(o => o.trim().toLowerCase()));
  if (uniqueOptions.size !== 4) {
    return 'Options must not contain duplicate content.';
  }

  // Answer matching
  const hasAnswer = options.some(o => o.trim() === correctAnswer.trim());
  if (!hasAnswer) {
    return `Correct answer "${correctAnswer}" must match one of the options.`;
  }

  if (!explanation || explanation.trim().length < 5) {
    return 'Explanation must be at least 5 characters long.';
  }

  return null; // Valid
};
