import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, isAuthError, apiError } from "@/lib/api-auth";
import { calculateSRS } from "@/lib/srs";
import {
  SRSCard,
  SRSQuality,
  SessionResult,
  LanguageCode,
  Lesson,
  LessonItem,
  PracticeMode,
  ExerciseTypeFilter,
} from "@/types";
import { today, shuffle, pickRandom } from "@/lib/utils";

const MAX_SESSION = 20;

// ─────────────────────────────────────────────────────────────────
// GET /api/session?language=de&mode=daily|weak|new&exerciseType=mcq|fill|both&limit=20&lessonId=…
// mode=daily (default) → SRS due cards
// mode=weak            → cards flagged for review (struggled words)
// mode=new             → cards never studied yet (repetitions=0)
// lessonId             → overrides mode; returns all cards for that lesson
// exerciseType         → mcq | fill | both (default)
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (isAuthError(decoded)) return decoded;

  const uid = decoded.uid;
  const language = req.nextUrl.searchParams.get(
    "language",
  ) as LanguageCode | null;
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  const mode = (req.nextUrl.searchParams.get("mode") ??
    "daily") as PracticeMode;
  const exerciseType = (req.nextUrl.searchParams.get("exerciseType") ??
    "both") as ExerciseTypeFilter;
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") ?? MAX_SESSION),
    50,
  );

  if (!language) return apiError("Missing required query param: language");

  // 1. Fetch lessons + all user cards + user profile IN PARALLEL
  const [lessonsSnap, allCardsSnap, userSnap] = await Promise.all([
    adminDb.collection("lessons").where("language", "==", language).get(),
    adminDb
      .collection("users")
      .doc(uid)
      .collection("cards")
      .where("language", "==", language)
      .get(),
    adminDb.collection("users").doc(uid).get(),
  ]);

  const lessons: Lesson[] = lessonsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lesson, "id">),
  }));

  // Lessons the user has hidden from practice
  const excludedLessons: string[] =
    (userSnap.data()?.excludedLessons as string[]) ?? [];

  // Build an in-memory map of existing cards; skip excluded lessons
  const existingCards = new Map<string, SRSCard>(
    allCardsSnap.docs
      .filter((d) => {
        const card = d.data() as SRSCard;
        return !lessonId && excludedLessons.includes(card.lessonId)
          ? false // exclude unless we're in explicit lesson mode
          : true;
      })
      .map((d) => {
        const card = d.data() as SRSCard;
        return [card.id, card];
      }),
  );

  // 2. Select cards based on mode (or lessonId override)
  const todayStr = today();
  let cards: SRSCard[];

  // Helper: build a virtual (unsaved) card stub for items never yet answered
  const virtualCard = (lesson: Lesson, item: LessonItem): SRSCard => ({
    id: `${language}_${lesson.id}_${item.id}`,
    uid,
    language,
    lessonId: lesson.id,
    itemId: item.id,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: today(),
    lastReviewed: null,
  });

  if (lessonId) {
    // Explicit lesson mode — show all words in that lesson regardless of exclusion
    // Include virtual cards for items not yet answered (lazy bootstrap)
    const targetLesson = lessons.find((l) => l.id === lessonId);
    if (!targetLesson) {
      cards = [];
    } else {
      const lessonCards = targetLesson.items.map((item) => {
        const cardId = `${language}_${targetLesson.id}_${item.id}`;
        return existingCards.get(cardId) ?? virtualCard(targetLesson, item);
      });
      cards = shuffle(lessonCards).slice(0, limit);
    }
  } else if (mode === "weak") {
    // Struggled / failed words
    cards = shuffle(
      Array.from(existingCards.values()).filter((c) => c.flaggedForReview),
    ).slice(0, limit);
  } else if (mode === "new") {
    // Words never studied: existing repetitions=0 cards + items with no card yet
    const seenCardIds = new Set(existingCards.keys());
    const virtualNewCards: SRSCard[] = [];
    for (const lesson of lessons) {
      if (excludedLessons.includes(lesson.id)) continue;
      for (const item of lesson.items) {
        const cardId = `${language}_${lesson.id}_${item.id}`;
        if (!seenCardIds.has(cardId))
          virtualNewCards.push(virtualCard(lesson, item));
      }
    }
    cards = shuffle([
      ...Array.from(existingCards.values()).filter((c) => c.repetitions === 0),
      ...virtualNewCards,
    ]).slice(0, limit);
  } else {
    // Daily: SRS due cards first, fall back to earliest-due
    const dueCards = Array.from(existingCards.values()).filter(
      (c) => c.dueDate <= todayStr,
    );
    if (dueCards.length > 0) {
      cards = shuffle(dueCards).slice(0, limit);
    } else {
      cards = Array.from(existingCards.values())
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, limit);
    }
  }

  const totalDue = cards.length;

  // 3. Build exercise objects
  const lessonMap = new Map<string, Lesson>(lessons.map((l) => [l.id, l]));
  const allItems: LessonItem[] = lessons.flatMap((l) => l.items);

  // itemId → category for same-category distractors
  const itemCategory = new Map<string, string>();
  for (const l of lessons) {
    for (const i of l.items) itemCategory.set(i.id, l.category);
  }

  // Deduplicate cards by itemId
  const seenItemIds = new Set<string>();
  const uniqueCards = cards.filter((c) => {
    if (seenItemIds.has(c.itemId)) return false;
    seenItemIds.add(c.itemId);
    return true;
  });

  const exercises = uniqueCards
    .map((card) => {
      const lesson = lessonMap.get(card.lessonId);
      if (!lesson) return null;
      const item = lesson.items.find((i) => i.id === card.itemId);
      if (!item) return null;

      // Determine type pool based on exerciseType param and card repetitions
      let typePool: Array<"mcq" | "fill">;
      if (exerciseType === "mcq") {
        typePool = ["mcq"];
      } else if (exerciseType === "fill") {
        typePool = ["fill"];
      } else {
        // "both": weight towards MCQ for fresh cards, mix in fill once user has reps
        typePool = card.repetitions < 2 ? ["mcq"] : ["mcq", "mcq", "fill"];
      }
      const type = typePool[Math.floor(Math.random() * typePool.length)];

      const cat = itemCategory.get(item.id);
      const sameCategory = allItems.filter(
        (i) => i.id !== item.id && itemCategory.get(i.id) === cat,
      );
      const distPool =
        sameCategory.length >= 3
          ? sameCategory
          : allItems.filter((i) => i.id !== item.id);
      const distractors = pickRandom(distPool, 3);

      return { type, item, lesson, card, distractors };
    })
    .filter(Boolean);

  return NextResponse.json({ exercises, totalDue, mode });
}

// ─────────────────────────────────────────────────────────────────
// POST /api/session
// Save session results and update SRS cards + user profile.
// ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (isAuthError(decoded)) return decoded;

  const uid = decoded.uid;
  const body = (await req.json()) as {
    language: string;
    results: SessionResult[];
  };

  if (!body.results?.length) return apiError("No results provided");

  const batch = adminDb.batch();
  let cardsUpdated = 0;

  // Fetch all cards in parallel (lazy: card may not exist yet)
  const cardRefs = body.results.map((r) =>
    adminDb.collection("users").doc(uid).collection("cards").doc(r.cardId),
  );
  const snaps = await Promise.all(cardRefs.map((ref) => ref.get()));

  for (let i = 0; i < body.results.length; i++) {
    const result = body.results[i];
    const cardRef = cardRefs[i];
    const snap = snaps[i];

    let card: SRSCard;
    if (snap.exists) {
      card = snap.data() as SRSCard;
    } else {
      // Lazy create: parse components from cardId (format: lang_lessonId_itemId)
      const parts = result.cardId.split("_");
      const lang = parts[0] as LanguageCode;
      const itemId = parts[parts.length - 1];
      const lessonId = parts.slice(1, -1).join("_");
      card = {
        id: result.cardId,
        uid,
        language: lang,
        lessonId,
        itemId,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        dueDate: today(),
        lastReviewed: null,
      };
    }

    const updated = calculateSRS(card, result.quality as SRSQuality);
    // Use set+merge so it works for both new and existing cards
    batch.set(
      cardRef,
      {
        ...card,
        ...updated,
        // Flag for review when the user struggles; clear when they get it right
        flaggedForReview: result.quality <= 1,
      } as unknown as Record<string, unknown>,
      { merge: true },
    );
    cardsUpdated++;
  }

  // Update user streak and XP
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();

  let newStreak = 1;
  let totalXP = 0;

  if (userSnap.exists) {
    const user = userSnap.data()!;
    const todayStr = today();
    const isNewSession = user.lastSessionDate !== todayStr;

    const prevDay = (() => {
      const [y, m, d] = todayStr.split("-").map(Number);
      return new Date(y, m - 1, d - 1).toISOString().slice(0, 10);
    })();

    newStreak = isNewSession
      ? user.lastSessionDate === prevDay
        ? user.streakCount + 1
        : 1
      : user.streakCount;

    const xpGained = body.results.reduce(
      (sum, r) => sum + ([0, 5, 10, 15][r.quality] ?? 0),
      0,
    );
    totalXP = (user.totalXP ?? 0) + xpGained;

    batch.update(userRef, {
      streakCount: newStreak,
      lastSessionDate: todayStr,
      totalXP,
    });
  }

  await batch.commit();

  const xpGained = body.results.reduce(
    (sum, r) => sum + ([0, 5, 10, 15][r.quality] ?? 0),
    0,
  );

  return NextResponse.json({ xpGained, newStreak, totalXP, cardsUpdated });
}
