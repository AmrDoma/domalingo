import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, SRSCard, LanguageCode, SessionResult } from "@/types";
import { calculateSRS } from "@/lib/srs";
import { today } from "@/lib/utils";

// ─── User Profile ────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", profile.uid), {
    ...profile,
    createdAt: Date.now(),
  });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data as Record<string, unknown>);
}

// ─── SRS Cards ─────────────────────────────────────────────────

function cardId(language: string, lessonId: string, itemId: string): string {
  return `${language}_${lessonId}_${itemId}`;
}

export async function getOrCreateCard(
  uid: string,
  language: LanguageCode,
  lessonId: string,
  itemId: string,
): Promise<SRSCard> {
  const id = cardId(language, lessonId, itemId);
  const ref = doc(db, "users", uid, "cards", id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as SRSCard;
  }

  const card: SRSCard = {
    id,
    uid,
    language,
    lessonId,
    itemId,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: today(),
    lastReviewed: null,
  };
  await setDoc(ref, card);
  return card;
}

export async function getDueCards(
  uid: string,
  language: LanguageCode,
): Promise<SRSCard[]> {
  const colRef = collection(db, "users", uid, "cards");
  const q = query(
    colRef,
    where("language", "==", language),
    where("dueDate", "<=", today()),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SRSCard);
}

export async function getAllCards(
  uid: string,
  language: LanguageCode,
): Promise<SRSCard[]> {
  const colRef = collection(db, "users", uid, "cards");
  const q = query(colRef, where("language", "==", language));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SRSCard);
}

// ─── Session Saving ─────────────────────────────────────────────

export async function saveSessionResults(
  uid: string,
  results: SessionResult[],
): Promise<void> {
  if (!results.length) return;

  // Fetch all affected cards, recalculate, and batch-write
  const batch = writeBatch(db);

  for (const result of results) {
    const ref = doc(db, "users", uid, "cards", result.cardId);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const card = snap.data() as SRSCard;
    const updated = calculateSRS(card, result.quality);
    batch.update(ref, updated as unknown as Record<string, unknown>);
  }

  // Update user streak & XP
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const user = userSnap.data() as UserProfile;
    const todayStr = today();
    const isNewSession = user.lastSessionDate !== todayStr;

    const newStreak =
      isNewSession && user.lastSessionDate === getPreviousDay(todayStr)
        ? user.streakCount + 1
        : isNewSession
          ? 1
          : user.streakCount;

    const xpGained = results.reduce(
      (sum, r) => sum + [0, 5, 10, 15][r.quality],
      0,
    );

    batch.update(userRef, {
      streakCount: newStreak,
      lastSessionDate: todayStr,
      totalXP: (user.totalXP ?? 0) + xpGained,
    });
  }

  await batch.commit();
}

function getPreviousDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d - 1);
  return date.toISOString().slice(0, 10);
}

// ─── Lesson Card Bootstrap ──────────────────────────────────────

/**
 * Ensure all items in a lesson have a corresponding SRS card for the user.
 * Call this when a user starts a lesson for the first time.
 */
export async function bootstrapLessonCards(
  uid: string,
  language: LanguageCode,
  lessonId: string,
  itemIds: string[],
): Promise<void> {
  const batch = writeBatch(db);

  for (const itemId of itemIds) {
    const id = cardId(language, lessonId, itemId);
    const ref = doc(db, "users", uid, "cards", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const card: SRSCard = {
        id,
        uid,
        language,
        lessonId,
        itemId,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        dueDate: today(),
        lastReviewed: null,
      };
      batch.set(ref, card);
    }
  }

  await batch.commit();
}
