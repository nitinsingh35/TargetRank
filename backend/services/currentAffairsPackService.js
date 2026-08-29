import CurrentAffairsPack from '../models/CurrentAffairsPack.js';
import CurrentAffairsSource from '../models/CurrentAffairsSource.js';
import Question from '../models/Question.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import PracticeSession from '../models/PracticeSession.js';
import mongoose from 'mongoose';

/**
 * 1. validateCurrentAffairsPack(packId)
 * Returns detailed validation report of the current affairs pack.
 */
export async function validateCurrentAffairsPack(packId) {
  try {
    const pack = await CurrentAffairsPack.findById(packId).lean();
    if (!pack) {
      throw new Error('Current Affairs Pack not found.');
    }

    const linkedQuestionIds = pack.questionIds || [];
    const uniqueQuestionIds = [...new Set(linkedQuestionIds.map(id => id.toString()))];

    const questions = await Question.find({ _id: { $in: linkedQuestionIds } }).lean();
    const qMap = new Map(questions.map(q => [q._id.toString(), q]));

    const linkedSourceIds = pack.sourceIds || [];
    const sources = await CurrentAffairsSource.find({ _id: { $in: linkedSourceIds } }).lean();
    const sMap = new Map(sources.map(s => [s._id.toString(), s]));

    let validQuestions = 0;
    let missingQuestions = linkedQuestionIds.length - questions.length;
    let unpublishedQuestions = 0;
    let unverifiedQuestions = 0;
    let archivedQuestions = 0;
    let wrongSourceTypeQuestions = 0;
    let missingSourceMetadataQuestions = 0;
    let duplicateQuestionIds = linkedQuestionIds.length - uniqueQuestionIds.length;

    let validSources = 0;
    let missingSources = linkedSourceIds.length - sources.length;
    let unverifiedSources = 0;

    const errors = [];

    // Validate Questions
    for (const qId of linkedQuestionIds) {
      const qStr = qId.toString();
      const q = qMap.get(qStr);

      if (!q) {
        errors.push(`Question ID ${qStr} does not exist in the database.`);
        continue;
      }

      if (q.sourceType !== 'current_affairs') {
        wrongSourceTypeQuestions++;
        errors.push(`Question ID ${qStr} has invalid sourceType: '${q.sourceType}' (expected 'current_affairs').`);
      }

      if (!q.currentAffairsMonth || !q.currentAffairsYear || !q.currentAffairsCategory || !q.sourceName || !q.sourceReliability) {
        missingSourceMetadataQuestions++;
        errors.push(`Question ID ${qStr} is missing required current affairs source metadata.`);
      }

      if (q.qualityStatus !== 'approved') {
        unpublishedQuestions++; // counted as unpublished because not approved
        errors.push(`Question ID ${qStr} is not approved (qualityStatus = '${q.qualityStatus}').`);
      }

      if (!q.isVerified || !q.sourceVerified) {
        unverifiedQuestions++;
        errors.push(`Question ID ${qStr} is not verified.`);
      }

      if (!q.isPublished) {
        unpublishedQuestions++;
        errors.push(`Question ID ${qStr} is not marked as published.`);
      }

      if (q.isArchived) {
        archivedQuestions++;
        errors.push(`Question ID ${qStr} is archived.`);
      }

      // Check month/year matching unless marked evergreen
      const monthMatch = q.currentAffairsMonth === pack.month;
      const yearMatch = q.currentAffairsYear === pack.year;
      if (!monthMatch || !yearMatch) {
        // Warning (allow unless strict, but log error/warning info)
        errors.push(`Warning: Question ID ${qStr} belongs to ${q.currentAffairsMonth}/${q.currentAffairsYear} but pack is for ${pack.month}/${pack.year}.`);
      }

      // If all rules satisfy:
      if (
        q.sourceType === 'current_affairs' &&
        q.qualityStatus === 'approved' &&
        q.isVerified &&
        q.sourceVerified &&
        q.isPublished &&
        !q.isArchived
      ) {
        validQuestions++;
      }
    }

    // Validate Sources
    for (const sId of linkedSourceIds) {
      const sStr = sId.toString();
      const s = sMap.get(sStr);

      if (!s) {
        errors.push(`Source ID ${sStr} does not exist in the database.`);
        continue;
      }

      if (!s.isVerified || s.status !== 'approved') {
        unverifiedSources++;
        errors.push(`Source '${s.title}' is not verified/approved.`);
      } else {
        validSources++;
      }
    }

    // A pack can only be published if:
    // - At least one linked question exists
    // - No missing, wrong source type, archived, or unverified questions
    // - No unverified sources
    const canPublish =
      linkedQuestionIds.length > 0 &&
      missingQuestions === 0 &&
      unpublishedQuestions === 0 &&
      unverifiedQuestions === 0 &&
      archivedQuestions === 0 &&
      wrongSourceTypeQuestions === 0 &&
      unverifiedSources === 0 &&
      missingSources === 0;

    return {
      totalLinkedQuestions: linkedQuestionIds.length,
      validQuestions,
      missingQuestions,
      unpublishedQuestions,
      unverifiedQuestions,
      archivedQuestions,
      wrongSourceTypeQuestions,
      missingSourceMetadataQuestions,
      duplicateQuestionIds,
      validSources,
      missingSources,
      unverifiedSources,
      canPublish,
      errors,
    };
  } catch (error) {
    console.error('validateCurrentAffairsPack error:', error);
    throw error;
  }
}

/**
 * 2. generateCurrentAffairsPractice(packId, userId, requestedQuestionCount)
 * Generates an active PracticeSession using questions from a monthly pack.
 */
export async function generateCurrentAffairsPractice(packId, userId, requestedQuestionCount = 20) {
  try {
    const pack = await CurrentAffairsPack.findById(packId);
    if (!pack) {
      throw new Error('Current affairs pack not found.');
    }

    if (!pack.isPublished || pack.status !== 'published') {
      throw new Error('This current affairs pack is not available for practice.');
    }

    const questionIds = pack.questionIds || [];
    if (questionIds.length === 0) {
      throw new Error('This pack contains no questions.');
    }

    // Fetch details of all pack questions
    const allQuestions = await Question.find({
      _id: { $in: questionIds },
      isPublished: true,
      isVerified: true,
      qualityStatus: 'approved',
      isArchived: { $ne: true }
    }).populate('subjectId', 'title').populate('topicId', 'title');

    if (allQuestions.length === 0) {
      throw new Error('No published, verified questions are available in this pack.');
    }

    // Fetch questions attempted by the user in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentAttempts, recentPractices] = await Promise.all([
      MockTestAttempt.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      }).select('responses.questionId').lean(),
      PracticeSession.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      }).select('questionIds').lean()
    ]);

    const attemptedIds = new Set();
    for (const att of recentAttempts) {
      if (att.responses) {
        for (const r of att.responses) {
          if (r.questionId) attemptedIds.add(r.questionId.toString());
        }
      }
    }
    for (const pr of recentPractices) {
      if (pr.questionIds) {
        for (const qId of pr.questionIds) {
          attemptedIds.add(qId.toString());
        }
      }
    }

    // Separate into unattempted and attempted
    const unattempted = [];
    const attempted = [];

    for (const q of allQuestions) {
      if (attemptedIds.has(q._id.toString())) {
        attempted.push(q);
      } else {
        unattempted.push(q);
      }
    }

    // Mix/sort preferring unattempted
    // Shuffle helper
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);
    shuffle(unattempted);
    shuffle(attempted);

    let selected = [...unattempted];
    if (selected.length < requestedQuestionCount) {
      const needed = requestedQuestionCount - selected.length;
      selected = [...selected, ...attempted.slice(0, needed)];
    } else {
      selected = selected.slice(0, requestedQuestionCount);
    }

    let warningMessage = null;
    if (allQuestions.length < requestedQuestionCount) {
      warningMessage = `Only ${allQuestions.length} verified questions are currently available in this current affairs pack.`;
    }

    // Create the PracticeSession
    const firstExamId = pack.examIds[0] || null;
    const durationMinutes = pack.estimatedPracticeMinutes || 30;
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);

    const session = await PracticeSession.create({
      userId,
      examId: firstExamId,
      phaseId: pack.phaseIds[0] || null,
      mode: 'custom_mock', // fallback compatibility
      practiceMode: 'current_affairs',
      currentAffairsPackId: pack._id,
      currentAffairsMonth: pack.month,
      currentAffairsYear: pack.year,
      currentAffairsCategories: pack.categories,
      durationMinutes,
      requestedQuestionCount: Math.min(requestedQuestionCount, allQuestions.length),
      generatedQuestionCount: selected.length,
      questionIds: selected.map(q => q._id),
      expiresAt,
      status: 'created'
    });

    // Strip answers and explanations
    const strippedQuestions = selected.map(q => {
      const qObj = q.toObject();
      delete qObj.correctAnswer;
      delete qObj.correctAnswers;
      delete qObj.explanation;
      delete qObj.explanationHindi;
      return qObj;
    });

    return {
      session,
      questions: strippedQuestions,
      warningMessage
    };
  } catch (error) {
    console.error('generateCurrentAffairsPractice error:', error);
    throw error;
  }
}

/**
 * 3. getCurrentAffairsCoverage(filters)
 * Returns coverage analytics based on published data.
 */
export async function getCurrentAffairsCoverage(filters = {}) {
  try {
    const packFilter = { isPublished: true, status: 'published' };
    if (filters.examId) packFilter.examIds = filters.examId;
    if (filters.phaseId) packFilter.phaseIds = filters.phaseId;
    if (filters.month) packFilter.month = Number(filters.month);
    if (filters.year) packFilter.year = Number(filters.year);
    if (filters.language) packFilter.language = filters.language;
    if (filters.category) packFilter.categories = filters.category;

    const packs = await CurrentAffairsPack.find(packFilter).lean();

    const uniqueQuestionIds = new Set();
    const categoryCount = {};
    const monthlyPackAvailability = {};
    const examPackAvailability = {};

    for (const pack of packs) {
      if (pack.questionIds) {
        for (const qId of pack.questionIds) {
          uniqueQuestionIds.add(qId.toString());
        }
      }

      // Monthly availability mapping
      const monthYearKey = `${pack.month}/${pack.year}`;
      monthlyPackAvailability[monthYearKey] = (monthlyPackAvailability[monthYearKey] || 0) + 1;

      // Exam availability
      if (pack.examIds) {
        for (const exId of pack.examIds) {
          const exStr = exId.toString();
          examPackAvailability[exStr] = (examPackAvailability[exStr] || 0) + 1;
        }
      }
    }

    // Fetch verified questions count by category
    const questionFilter = {
      _id: { $in: Array.from(uniqueQuestionIds) },
      sourceType: 'current_affairs',
      isPublished: true,
      isVerified: true,
      qualityStatus: 'approved',
      isArchived: { $ne: true }
    };

    const questions = await Question.find(questionFilter).select('currentAffairsCategory').lean();
    for (const q of questions) {
      const cat = q.currentAffairsCategory || 'miscellaneous';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }

    return {
      totalPacks: packs.length,
      totalAvailableQuestions: questions.length,
      categoryWiseCount: categoryCount,
      monthlyPackAvailability,
      examPackAvailability
    };
  } catch (error) {
    console.error('getCurrentAffairsCoverage error:', error);
    throw error;
  }
}
