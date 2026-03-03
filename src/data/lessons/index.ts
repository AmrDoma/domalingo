/**
 * ⚠️  NOT USED BY THE APP.
 * Lessons are fetched from Firestore via /api/lessons.
 * This file exists only as a reference index.
 */
import { Lesson, LanguageCode } from "@/types";
import { germanLessons } from "./german";

/** All lessons keyed by language code */
export const ALL_LESSONS: Record<string, Lesson[]> = {
  de: germanLessons,
};

/** Get lessons for a specific language */
export function getLessons(language: LanguageCode): Lesson[] {
  return ALL_LESSONS[language] ?? [];
}

/** Find a lesson by ID */
export function getLessonById(id: string): Lesson | undefined {
  for (const lessons of Object.values(ALL_LESSONS)) {
    const found = lessons.find((l) => l.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Get all items from all lessons for a given language (for distractor generation) */
export function getAllItems(language: LanguageCode) {
  return getLessons(language).flatMap((l) => l.items);
}
