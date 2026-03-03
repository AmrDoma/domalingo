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
} from "@/types";
import { today, shuffle, pickRandom } from "@/lib/utils";

const MAX_SESSION = 20;

// ─────────────────────────────────────────────────────────────────
// GET /api/session?language=de&limit=20
// Returns today's due exercises for the authenticated user.
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (isAuthError(decoded)) return decoded;

  const uid = decoded.uid;
  const language = req.nextUrl.searchParams.get(
    "language",
  ) as LanguageCode | null;
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") ?? MAX_SESSION),
    50,
  );

  if (!language) return apiError("Missing required query param: language");

  // 1. Bootstrap cards for any new lessons (idempotent)
  const lessonsSnap = await adminDb
    .collection("lessons")
    .where("language", "==", language)
    .get();

  const lessons: Lesson[] = lessonsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lesson, "id">),
  }));

  const batch = adminDb.batch();
  let bootstrapped = 0;

  for (const lesson of lessons) {
    for (const item of lesson.items) {
      const cardId = `${language}_${lesson.id}_${item.id}`;
      const cardRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("cards")
        .doc(cardId);

      const snap = await cardRef.get();
      if (!snap.exists) {
        const card: SRSCard = {
          id: cardId,
          uid,
          language,
          lessonId: lesson.id,
          itemId: item.id,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today(),
          lastReviewed: null,
        };
        batch.set(cardRef, card);
        bootstrapped++;
      }
    }
  }
  if (bootstrapped > 0) await batch.commit();

  // 2. Get cards (lesson-specific: all words; regular: due cards only)
  let cards: SRSCard[];

  if (lessonId) {
    // Lesson mode: show every word in that lesson, shuffled
    const snap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("cards")
      .where("language", "==", language)
      .where("lessonId", "==", lessonId)
      .get();
    cards = shuffle(snap.docs.map((d) => d.data() as SRSCard)).slice(0, limit);
  } else {
    // Daily mode: due cards first, fall back to earliest if none due
    const dueSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("cards")
      .where("language", "==", language)
      .where("dueDate", "<=", today())
      .get();
    cards = dueSnap.docs.map((d) => d.data() as SRSCard);
    if (!cards.length) {
      const allSnap = await adminDb
        .collection("users")
        .doc(uid)
        .collection("cards")
        .where("language", "==", language)
        .orderBy("dueDate")
        .limit(limit)
        .get();
      cards = allSnap.docs.map((d) => d.data() as SRSCard);
    } else {
      cards = shuffle(cards).slice(0, limit);
    }
  }

  const totalDue = cards.length;

  // 3. Build exercise objects
  const lessonMap = new Map<string, Lesson>(lessons.map((l) => [l.id, l]));
  const allItems: LessonItem[] = lessons.flatMap((l) => l.items);

  // itemId → category, so distractors stay within the same category
  const itemCategory = new Map<string, string>();
  for (const l of lessons) {
    for (const i of l.items) itemCategory.set(i.id, l.category);
  }

  // Deduplicate cards by itemId — same word can exist in multiple lessons
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

      // Image exercises disabled – only MCQ and fill
      const typePool: Array<"mcq" | "fill"> =
        card.repetitions < 2 ? ["mcq"] : ["mcq", "mcq", "fill"];
      const type = typePool[Math.floor(Math.random() * typePool.length)];

      const cat = itemCategory.get(item.id);
      const sameCategory = allItems.filter(
        (i) => i.id !== item.id && itemCategory.get(i.id) === cat,
      );
      // Fall back to all items if the category is too small
      const distPool =
        sameCategory.length >= 3
          ? sameCategory
          : allItems.filter((i) => i.id !== item.id);
      const distractors = pickRandom(distPool, 3);

      return { type, item, lesson, card, distractors };
    })
    .filter(Boolean);

  return NextResponse.json({ exercises, totalDue });
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

  for (const result of body.results) {
    const cardRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("cards")
      .doc(result.cardId);

    const snap = await cardRef.get();
    if (!snap.exists) continue;

    const card = snap.data() as SRSCard;
    const updated = calculateSRS(card, result.quality as SRSQuality);
    batch.update(cardRef, {
      ...updated,
      // Flag for review when the user struggles; clear when they get it right
      flaggedForReview: result.quality <= 1,
    } as unknown as Record<string, unknown>);
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
