/**
 * revisionSchedulerService.js
 *
 * Spaced-repetition scheduling logic for the TargetRank revision system.
 *
 * Exported function:
 *   calculateNextRevision(action, revisionCount, confidenceLevel, currentMasteryScore)
 *
 * Supported actions:
 *   'incorrect_again' | 'skipped' | 'revised' | 'mastered'
 *
 * Returns:
 *   { nextRevisionDate, priority, status, masteryScore }
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a Date set to the START of the day N days from now.
 * Using start-of-day prevents cumulative drift when the function is called
 * at different times of the day across multiple sessions.
 *
 * @param {number} days - Number of days from today
 * @returns {Date}
 */
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, days));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Clamp a number between min and max (inclusive).
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ── Gap table for 'revised' action ───────────────────────────────────────────
// Index corresponds to revisionCount AFTER the current attempt.
// e.g. first ever revision (count becomes 1) → 1 day gap.
const REVISED_GAP_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
};
const REVISED_GAP_DEFAULT = 30; // revisionCount >= 5

// ── Core export ───────────────────────────────────────────────────────────────

/**
 * Calculates the next revision schedule after a user action on a revision item.
 *
 * @param {'incorrect_again'|'skipped'|'revised'|'mastered'} action
 *   The action the user took during revision.
 *
 * @param {number} revisionCount
 *   The current revision count BEFORE this attempt (will be incremented externally).
 *   Used to determine the gap for 'revised' action.
 *
 * @param {'low'|'medium'|'high'|undefined} confidenceLevel
 *   User's self-assessed confidence. Adjusts the gap by ±1 day.
 *
 * @param {number} currentMasteryScore
 *   Current mastery score (0–100) before this attempt.
 *
 * @returns {{
 *   nextRevisionDate: Date,
 *   priority: 'low'|'medium'|'high',
 *   status: 'pending'|'mastered',
 *   masteryScore: number
 * }}
 */
export function calculateNextRevision(
  action,
  revisionCount = 0,
  confidenceLevel = 'medium',
  currentMasteryScore = 0
) {
  let gapDays;
  let priority;
  let status;
  let masteryScore;

  // ── 1. Determine base gap, priority, status and mastery delta ────────────
  switch (action) {
    case 'incorrect_again':
      gapDays     = 1;
      priority    = 'high';
      status      = 'pending';
      masteryScore = clamp(currentMasteryScore - 10, 0, 100);
      break;

    case 'skipped':
      gapDays     = 1;
      priority    = 'high';
      status      = 'pending';
      masteryScore = clamp(currentMasteryScore - 5, 0, 100);
      break;

    case 'revised': {
      // revisionCount is the count BEFORE this attempt; after this attempt it
      // becomes revisionCount + 1 — that is the count we look up in the table.
      const nextCount = revisionCount + 1;
      gapDays     = REVISED_GAP_DAYS[nextCount] ?? REVISED_GAP_DEFAULT;
      priority    = 'medium';
      status      = 'pending';
      masteryScore = clamp(currentMasteryScore + 10, 0, 100);
      break;
    }

    case 'mastered':
      gapDays     = 30;
      priority    = 'low';
      status      = 'mastered';
      masteryScore = clamp(currentMasteryScore + 20, 0, 100);
      break;

    default:
      // Unknown action — safe fallback: schedule for tomorrow, no mastery change
      gapDays     = 1;
      priority    = 'medium';
      status      = 'pending';
      masteryScore = currentMasteryScore;
      break;
  }

  // ── 2. Apply confidence-level gap adjustment ──────────────────────────────
  if (confidenceLevel === 'low') {
    // Low confidence → revise sooner (−1 day, minimum 1 day)
    gapDays = Math.max(1, gapDays - 1);
  } else if (confidenceLevel === 'high') {
    // High confidence → stretch the interval (+1 day)
    gapDays = gapDays + 1;
  }
  // 'medium' or undefined → no adjustment

  // ── 3. Build the scheduled date ──────────────────────────────────────────
  const nextRevisionDate = daysFromNow(gapDays);

  return {
    nextRevisionDate,
    priority,
    status,
    masteryScore,
  };
}
