// ─── Language ────────────────────────────────────────────────────
export type LanguageCode =
  | "de"
  | "fr"
  | "es"
  | "it"
  | "pt"
  | "nl"
  | "pl"
  | "tr";

export interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

// ─── Lesson & Items ───────────────────────────────────────────────
export type LessonCategory =
  | "room"
  | "kitchen"
  | "colors"
  | "directions"
  | "numbers"
  | "verbs"
  | "adjectives"
  | "devices"
  | "food"
  | "body"
  | "clothing"
  | "transport"
  | "nature"
  | "time";

export interface LessonItem {
  id: string;
  /** Word in the target language */
  word: string;
  /** English translation */
  translation: string;
  /** Optional article / gender (e.g. "der", "die", "das") */
  article?: string;
  /** Direct image URL (GCP Storage) */
  imageUrl?: string;
  /** Fallback query for Unsplash */
  unsplashQuery?: string;
  /** Optional example sentence in target language */
  example?: string;
  /** Example sentence translation */
  exampleTranslation?: string;
}

export interface Lesson {
  id: string;
  language: LanguageCode;
  category: LessonCategory;
  title: string;
  description: string;
  emoji: string;
  items: LessonItem[];
  /**
   * When true, image exercises are included for words in this lesson.
   * Set this on concrete-noun lessons (kitchen, food, clothing, etc.).
   * Leave false/unset for colors, numbers, verbs, adjectives, etc.
   */
  imageSearch?: boolean;
}

// ─── User Profile ────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  targetLanguages: LanguageCode[];
  activeLanguage: LanguageCode;
  streakCount: number;
  lastSessionDate: string | null; // "YYYY-MM-DD"
  totalXP: number;
  createdAt: number; // epoch ms
  /** Lesson IDs the user has hidden from all practice modes */
  excludedLessons?: string[];
}

// ─── Practice Mode ───────────────────────────────────────────────
/** daily = SRS due queue | weak = flagged/failed words | new = never studied */
export type PracticeMode = "daily" | "weak" | "new";

/** mcq = multiple choice only | fill = fill-in-the-blank only | both = mixed */
export type ExerciseTypeFilter = "mcq" | "fill" | "both";

// ─── SRS Card ────────────────────────────────────────────────────
export interface SRSCard {
  id: string; // `${language}_${lessonId}_${itemId}`
  uid: string;
  language: LanguageCode;
  lessonId: string;
  itemId: string;
  // SM-2 fields
  interval: number; // days until next review
  easeFactor: number; // multiplier (starts at 2.5)
  repetitions: number; // consecutive successful reviews
  dueDate: string; // "YYYY-MM-DD"
  lastReviewed: string | null; // "YYYY-MM-DD"
  /** True when the user answered Again/Hard – queued for extra review */
  flaggedForReview?: boolean;
}

export type SRSQuality = 0 | 1 | 2 | 3; // again | hard | good | easy

// ─── Exercises ───────────────────────────────────────────────────
export type ExerciseType = "mcq" | "fill" | "image";

export interface Exercise {
  type: ExerciseType;
  item: LessonItem;
  lesson: Lesson;
  card: SRSCard;
  /** For MCQ: the 3 wrong options */
  distractors?: LessonItem[];
}

// ─── Session ─────────────────────────────────────────────────────
export interface SessionResult {
  cardId: string;
  quality: SRSQuality;
  answeredAt: number;
}
