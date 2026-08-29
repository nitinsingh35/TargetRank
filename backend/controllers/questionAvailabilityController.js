import mongoose from 'mongoose';
import { getQuestionAvailability } from '../services/questionAvailabilityService.js';

/**
 * Helper to check object id format
 */
const validateId = (id, name, errors) => {
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    errors.push(`Invalid ${name} format.`);
  }
};

/**
 * Helper to check comma-separated list of object ids
 */
const validateIdList = (ids, name, errors) => {
  if (!ids) return;
  const list = typeof ids === 'string' ? ids.split(',') : ids;
  if (Array.isArray(list)) {
    list.forEach(id => {
      const cleanId = id.trim();
      if (cleanId && !mongoose.Types.ObjectId.isValid(cleanId)) {
        errors.push(`Invalid ID '${cleanId}' in ${name}.`);
      }
    });
  }
};

/**
 * @desc    Get dynamic verified question availability metrics matching criteria
 * @route   GET /api/questions/availability
 * @access  Private
 */
export const getQuestionAvailabilityMetrics = async (req, res, next) => {
  try {
    const {
      examId,
      phaseId,
      subjectIds,
      topicIds,
      subtopicIds,
      difficulty,
      language,
      sourceType,
      mode,
      durationMinutes,
      includeOriginalPractice,
      includePYQ
    } = req.query;

    // Validate inputs
    const errors = [];
    validateId(examId, 'examId', errors);
    validateId(phaseId, 'phaseId', errors);
    validateIdList(subjectIds, 'subjectIds', errors);
    validateIdList(topicIds, 'topicIds', errors);
    validateIdList(subtopicIds, 'subtopicIds', errors);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors
      });
    }

    // Call service to compute metrics
    const availability = await getQuestionAvailability({
      examId,
      phaseId,
      subjectIds,
      topicIds,
      subtopicIds,
      difficulty,
      language,
      sourceType,
      mode,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
      includeOriginalPractice: includeOriginalPractice === undefined ? true : (includeOriginalPractice === 'true' || includeOriginalPractice === true),
      includePYQ: includePYQ === undefined ? true : (includePYQ === 'true' || includePYQ === true)
    });

    res.status(200).json({
      success: true,
      availability
    });
  } catch (error) {
    next(error);
  }
};
