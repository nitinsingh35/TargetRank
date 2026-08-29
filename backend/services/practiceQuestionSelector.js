import { selectQuestionsForPractice } from './smartQuestionSelectorService.js';

/**
 * Wrapper function that delegates practice question selection to the new
 * smartQuestionSelectorService.
 *
 * @param {Object} session - The PracticeSession document containing filters and parameters
 * @returns {Promise<Object>} - Selection result including questions, availableCount, message, and selectionSummary
 */
export async function selectPracticeQuestions(session) {
  try {
    const {
      userId,
      examId,
      phaseId,
      subjectIds,
      topicIds,
      difficultyPreference,
      language,
      sourceFilter,
      requestedQuestionCount,
      _id
    } = session;

    // Map practice modes to the selector engine modes
    let selectorMode = 'practice';
    if (session.mode === 'pyq_only') {
      selectorMode = 'pyq';
    } else if (session.mode === 'revision_mode' || session.mode === 'revision') {
      selectorMode = 'revision';
    } else if (['full_mock', 'custom_mock'].includes(session.mode)) {
      selectorMode = 'mock';
    }

    // Determine includeOriginalPractice and includePYQ based on sourceFilter
    let includePYQ = true;
    let includeOriginalPractice = true;

    if (sourceFilter === 'pyq_only') {
      includeOriginalPractice = false;
    }

    const result = await selectQuestionsForPractice({
      userId,
      examId,
      phaseId,
      subjectIds,
      topicIds,
      difficulty: difficultyPreference,
      language,
      mode: selectorMode,
      includeOriginalPractice,
      includePYQ,
      requestedQuestionCount,
      practiceSessionId: _id
    });

    const selectedCount = result.selectionSummary.selectedCount;

    let message = null;
    if (selectedCount === 0) {
      message = 'No verified questions are currently available for your selected filters.';
    } else if (selectedCount < requestedQuestionCount) {
      message = `Only ${selectedCount} verified questions are currently available for your selected filters.`;
    }

    return {
      questions: result.questions,
      availableCount: selectedCount,
      selectionSummary: result.selectionSummary,
      message
    };
  } catch (error) {
    console.error('Error in smart selector delegate:', error);
    throw error;
  }
}
