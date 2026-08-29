import crypto from 'crypto';
import Question from '../../models/Question.js';

// Normalize text: lowercase, remove punctuation and multiple spaces
export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Generate MD5 content hash
export const generateHash = (text) => {
  const normalized = normalizeText(text);
  return crypto.createHash('md5').update(normalized).digest('hex');
};

// Token Jaccard Similarity Score
export const getSimilarityScore = (text1, text2) => {
  const words1 = new Set(normalizeText(text1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeText(text2).split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
};

// Find exact duplicates in database
export const findExactDuplicate = async (text) => {
  const contentHash = generateHash(text);
  return await Question.findOne({ contentHash });
};

// Find possible near-duplicates
export const findNearDuplicates = async (text, examId, threshold = 0.6) => {
  const candidates = await Question.find({ examId }).select('questionText normalizedQuestionText');
  const suggestions = [];

  for (const candidate of candidates) {
    const score = getSimilarityScore(text, candidate.questionText);
    if (score >= threshold) {
      suggestions.push({
        questionId: candidate._id,
        questionText: candidate.questionText,
        similarityScore: Math.round(score * 100),
      });
    }
  }

  return suggestions.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
};
