/**
 * SM-2 Spaced Repetition System
 * Based on the original SuperMemo 2 algorithm.
 *
 * Quality scale:
 *   0 = complete blackout / again
 *   1 = hard – responded with serious difficulty
 *   2 = good – responded after a hesitation
 *   3 = easy – perfect response
 */

import { SRSCard, SRSQuality } from "@/types";
import { today } from "@/lib/utils";

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

/** Map our 0-3 quality to the SM-2 0-5 quality */
function toSM2Quality(q: SRSQuality): number {
  return [0, 2, 4, 5][q];
}

/** Add `days` calendar days to "YYYY-MM-DD" */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return date.toISOString().slice(0, 10);
}

export interface SRSUpdate {
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string;
  lastReviewed: string;
}

/**
 * Calculate the updated SRS fields after a review.
 * @param card   Current card state
 * @param quality  User's quality rating (0–3)
 */
export function calculateSRS(card: SRSCard, quality: SRSQuality): SRSUpdate {
  const q = toSM2Quality(quality);
  const todayStr = today();

  let { interval, easeFactor, repetitions } = card;

  if (q < 3) {
    // Incorrect or very hard → reset
    repetitions = 0;
    interval = 1;
  } else {
    // Correct
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (SM-2 formula)
  easeFactor = Math.max(
    MIN_EASE,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return {
    interval,
    easeFactor,
    repetitions,
    dueDate: addDays(todayStr, interval),
    lastReviewed: todayStr,
  };
}

/** Build a brand-new SRS card (first time seeing an item) */
export function newCard(
  uid: string,
  language: string,
  lessonId: string,
  itemId: string,
): Omit<SRSCard, "id"> {
  return {
    uid,
    language: language as SRSCard["language"],
    lessonId,
    itemId,
    interval: 1,
    easeFactor: DEFAULT_EASE,
    repetitions: 0,
    dueDate: today(),
    lastReviewed: null,
  };
}

/** Is this card due today or overdue? */
export function isDue(card: SRSCard): boolean {
  return card.dueDate <= today();
}
