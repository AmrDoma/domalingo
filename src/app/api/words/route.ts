import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, isAuthError, apiError } from "@/lib/api-auth";
import { SRSCard, Lesson, LanguageCode } from "@/types";

export interface WeakWord {
  cardId: string;
  word: string;
  article?: string;
  translation: string;
  lessonId: string;
  lessonTitle: string;
  lessonEmoji: string;
}

export interface WordStats {
  weakWords: WeakWord[];
  encountered: number; // cards that have been answered at least once
  total: number; // all words across all lessons
  remaining: number; // total - encountered
}

// GET /api/words?language=de
export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (isAuthError(decoded)) return decoded;

  const uid = decoded.uid;
  const language = req.nextUrl.searchParams.get(
    "language",
  ) as LanguageCode | null;

  if (!language) return apiError("Missing required query param: language");

  // Fetch lessons + user cards in parallel
  const [lessonsSnap, cardsSnap] = await Promise.all([
    adminDb.collection("lessons").where("language", "==", language).get(),
    adminDb
      .collection("users")
      .doc(uid)
      .collection("cards")
      .where("language", "==", language)
      .get(),
  ]);

  const lessons: Lesson[] = lessonsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lesson, "id">),
  }));

  // Total words across all lessons
  const total = lessons.reduce((sum, l) => sum + l.items.length, 0);

  // All user cards
  const userCards: SRSCard[] = cardsSnap.docs.map((d) => d.data() as SRSCard);

  // Encountered = cards that have actually been answered (repetitions > 0 OR lastReviewed set)
  const encountered = userCards.filter(
    (c) => c.repetitions > 0 || c.lastReviewed !== null,
  ).length;

  // Build lookup maps
  const lessonMap = new Map<string, Lesson>(lessons.map((l) => [l.id, l]));

  // Weak words = flaggedForReview: true, enriched with item data
  const weakWords: WeakWord[] = userCards
    .filter((c) => c.flaggedForReview)
    .flatMap((card) => {
      const lesson = lessonMap.get(card.lessonId);
      if (!lesson) return [];
      const item = lesson.items.find((i) => i.id === card.itemId);
      if (!item) return [];
      return [
        {
          cardId: card.id,
          word: item.word,
          article: item.article,
          translation: item.translation,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonEmoji: lesson.emoji,
        },
      ];
    });

  return NextResponse.json({
    weakWords,
    encountered,
    total,
    remaining: Math.max(0, total - encountered),
  } satisfies WordStats);
}
