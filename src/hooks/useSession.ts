"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import {
  Exercise,
  SessionResult,
  SRSQuality,
  LessonItem,
  SRSCard,
  PracticeMode,
  ExerciseTypeFilter,
} from "@/types";
import { shuffle, pickRandom, today } from "@/lib/utils";

// ─── Guest session builder ────────────────────────────────────────────────────
// For guests, fetch public lesson data and build exercises locally (no SRS, no save).

async function buildGuestExercises(
  language: string,
): Promise<{ exercises: Exercise[]; totalDue: number }> {
  const lessons = await api.getLessons(language);
  const fullLessons = await Promise.all(
    lessons.slice(0, 3).map((l: { id: string }) => api.getLesson(l.id)),
  );
  const allItems: LessonItem[] = fullLessons.flatMap(
    (l: { items: LessonItem[] }) => l.items,
  );

  // Deduplicate allItems by id (same word can appear in multiple lessons)
  const seenIds = new Set<string>();
  const uniqueItems = allItems.filter((i) => {
    if (seenIds.has(i.id)) return false;
    seenIds.add(i.id);
    return true;
  });

  // itemId → category for same-category distractors
  const itemCategory = new Map<string, string>();
  for (const l of fullLessons as Array<{
    items: LessonItem[];
    category: string;
  }>) {
    for (const i of l.items) itemCategory.set(i.id, l.category);
  }

  const exerciseItems = shuffle(uniqueItems).slice(0, 10);

  const exercises: Exercise[] = exerciseItems.map((item) => {
    const lesson = fullLessons.find((l: { items: LessonItem[] }) =>
      l.items.some((i: LessonItem) => i.id === item.id),
    )!;
    const fakeCard: SRSCard = {
      id: `guest_${item.id}`,
      uid: "guest",
      language: language as SRSCard["language"],
      lessonId: lesson.id,
      itemId: item.id,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: today(),
      lastReviewed: null,
    };
    const typePool: Array<"mcq" | "fill"> = ["mcq", "mcq", "fill"];
    const type = typePool[Math.floor(Math.random() * typePool.length)];

    const cat = itemCategory.get(item.id);
    const sameCategory = uniqueItems.filter(
      (i) => i.id !== item.id && itemCategory.get(i.id) === cat,
    );
    const distPool =
      sameCategory.length >= 3
        ? sameCategory
        : uniqueItems.filter((i) => i.id !== item.id);
    const distractors = pickRandom(distPool, 3);
    return { type, item, lesson, card: fakeCard, distractors };
  });

  return { exercises, totalDue: exercises.length };
}

export interface SessionState {
  exercises: Exercise[];
  currentIndex: number;
  results: SessionResult[];
  status: "idle" | "loading" | "active" | "done" | "error";
  xpGained: number;
  totalDue: number;
  error: string | null;
}

export interface SessionActions {
  startSession: () => Promise<void>;
  submitAnswer: (quality: SRSQuality) => void;
}

export function useSession(
  lessonId?: string,
  mode: PracticeMode = "daily",
  exerciseType: ExerciseTypeFilter = "both",
): SessionState & SessionActions {
  const { profile, isGuest } = useAuth();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [status, setStatus] = useState<SessionState["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  // Guard: track which question index has already been answered.
  // Prevents double-advance if onAnswer fires twice (touch + click, Enter + click, etc.)
  const lastAnsweredIndex = useRef(-1);

  const xpGained = useMemo(
    () => results.reduce((sum, r) => sum + ([0, 5, 10, 15][r.quality] ?? 0), 0),
    [results],
  );

  const startSession = useCallback(async () => {
    if (!profile) return;
    lastAnsweredIndex.current = -1;
    setStatus("loading");
    setError(null);
    setResults([]);
    setCurrentIndex(0);

    try {
      const data = isGuest
        ? await buildGuestExercises(profile.activeLanguage)
        : await api.getSession(
            profile.activeLanguage,
            lessonId,
            mode,
            exerciseType,
          );

      if (!data.exercises.length) {
        setError("No exercises available right now. Come back tomorrow!");
        setStatus("error");
        return;
      }
      setExercises(data.exercises);
      setTotalDue(data.totalDue);
      setStatus("active");
    } catch (err) {
      console.error(err);
      setError("Failed to start session. Please try again.");
      setStatus("error");
    }
  }, [profile, isGuest, lessonId, mode, exerciseType]);

  const submitAnswer = useCallback(
    (quality: SRSQuality) => {
      if (status !== "active") return;
      // Drop if this index was already answered (double-tap / touch+click race)
      if (lastAnsweredIndex.current === currentIndex) return;
      lastAnsweredIndex.current = currentIndex;

      const current = exercises[currentIndex];
      const result: SessionResult = {
        cardId: current.card.id,
        quality,
        answeredAt: Date.now(),
      };

      const newResults = [...results, result];
      setResults(newResults);

      const next = currentIndex + 1;
      if (next >= exercises.length) {
        // Only persist if the user is signed in (not a guest)
        if (!isGuest && profile) {
          api
            .saveSession(profile.activeLanguage, newResults)
            .catch(console.error);
        }
        setStatus("done");
      } else {
        setCurrentIndex(next);
      }
    },
    [status, exercises, currentIndex, results, profile, isGuest],
  );

  return {
    exercises,
    currentIndex,
    results,
    totalDue,
    status,
    xpGained,
    error,
    startSession,
    submitAnswer,
  };
}
