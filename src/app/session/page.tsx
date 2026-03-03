"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/hooks/useSession";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { PracticeMode, ExerciseTypeFilter } from "@/types";

const TYPE_OPTIONS: {
  value: ExerciseTypeFilter;
  label: string;
  emoji: string;
  description: string;
  color: string;
  border: string;
  text: string;
  badge?: string;
}[] = [
  {
    value: "mcq",
    label: "Multiple Choice",
    emoji: "🔤",
    description: "Pick the correct translation from 4 options. Easier.",
    color: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    badge: "Easier",
  },
  {
    value: "fill",
    label: "Complete the word",
    emoji: "✍️",
    description: "Type the missing word from memory. More challenging.",
    color: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "Harder",
  },
  {
    value: "both",
    label: "Mixed",
    emoji: "🎲",
    description: "A mix of both types. Recommended for balanced practice.",
    color: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "Recommended",
  },
];

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <div className="animate-spin size-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
          <p className="text-gray-500 text-sm">Loading your exercises…</p>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}

function SessionContent() {
  const { user, isGuest, loading: authLoading, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson") ?? undefined;
  const mode = (searchParams.get("mode") ?? "daily") as PracticeMode;
  // null means the user hasn't picked yet (only relevant for lesson sessions)
  const exerciseTypeParam = searchParams.get(
    "type",
  ) as ExerciseTypeFilter | null;
  // For non-lesson sessions (daily/weak/new) default to "both" immediately
  const exerciseType: ExerciseTypeFilter =
    exerciseTypeParam ?? (lessonId ? null! : "both");
  // Show type picker when a lesson is selected but no type chosen yet
  const showTypePicker = !!lessonId && exerciseTypeParam === null;

  const {
    exercises,
    currentIndex,
    results,
    status,
    xpGained,
    totalDue,
    error,
    startSession,
    submitAnswer,
  } = useSession(lessonId, mode, exerciseType ?? "both");

  // Redirect if not authed
  useEffect(() => {
    if (!authLoading && !user && !isGuest) router.replace("/");
  }, [authLoading, user, isGuest, router]);

  // Auto-start once profile is ready — but NOT while waiting for the type picker
  useEffect(() => {
    if (!authLoading && profile && status === "idle" && !showTypePicker) {
      startSession();
    }
  }, [authLoading, profile, status, startSession, showTypePicker]);

  // ── Type picker (shown before session starts for lesson mode) ──────────────
  if (showTypePicker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-full max-w-sm">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 flex items-center gap-1 mb-6 hover:text-gray-600"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            Choose exercise type
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            How do you want to practice this lesson?
          </p>
          <div className="flex flex-col gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("type", opt.value);
                  router.replace(`/session?${params.toString()}`);
                }}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-98 hover:shadow-md ${opt.color} ${opt.border}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base ${opt.text}`}>
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${opt.color} ${opt.text} border ${opt.border}`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                  <span className={`text-lg ${opt.text}`}>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  if (authLoading || status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin size-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-gray-500 text-sm">Loading your exercises…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4">
        <div className="text-5xl">😴</div>
        <p className="text-gray-700 font-semibold text-center">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (status === "done") {
    const correct = results.filter((r) => r.quality >= 2).length;
    const accuracy =
      results.length > 0 ? Math.round((correct / results.length) * 100) : 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
        {/* Trophy */}
        <div className="text-7xl">
          {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "💪" : "📖"}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Session complete!
          </h1>
          <p className="text-gray-500 mt-1">Great work, keep it up!</p>
        </div>

        {/* Stats */}
        <div className="w-full max-w-sm grid grid-cols-3 gap-3">
          <ResultStat
            icon="⭐"
            label="XP Earned"
            value={`+${xpGained}`}
            color="text-yellow-500"
          />
          <ResultStat
            icon="✅"
            label="Correct"
            value={`${correct}/${results.length}`}
            color="text-green-500"
          />
          <ResultStat
            icon="🎯"
            label="Accuracy"
            value={`${accuracy}%`}
            color="text-indigo-500"
          />
        </div>

        {/* Quality breakdown */}
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Breakdown
          </p>
          {(
            [
              {
                label: "Easy",
                color: "bg-green-400",
                count: results.filter((r) => r.quality === 3).length,
              },
              {
                label: "Good",
                color: "bg-blue-400",
                count: results.filter((r) => r.quality === 2).length,
              },
              {
                label: "Hard",
                color: "bg-yellow-400",
                count: results.filter((r) => r.quality === 1).length,
              },
              {
                label: "Again",
                color: "bg-red-400",
                count: results.filter((r) => r.quality === 0).length,
              },
            ] as const
          ).map(({ label, color, count }) => (
            <div key={label} className="flex items-center gap-3 mb-2 last:mb-0">
              <div className={`size-3 rounded-full ${color}`} />
              <span className="text-sm text-gray-600 flex-1">{label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {count}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button fullWidth onClick={startSession} variant="primary" size="lg">
            Practice again
          </Button>
          <Button
            fullWidth
            onClick={() => router.push("/dashboard")}
            variant="secondary"
            size="lg"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────
  const progress =
    exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;
  const current = exercises[currentIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="max-w-lg mx-auto w-full px-4 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <button
            className="text-gray-400 hover:text-gray-600 p-1 -ml-1"
            onClick={() => router.push("/dashboard")}
            aria-label="Exit session"
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex-1">
            <ProgressBar value={progress} />
          </div>
          <span className="text-sm text-gray-500 shrink-0">
            {currentIndex + 1}/{exercises.length}
          </span>
        </div>
      </div>

      {/* Exercise */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-6">
        {current && (
          <ExerciseCard
            key={current.card.id}
            exercise={current}
            onAnswer={submitAnswer}
          />
        )}
      </div>
    </div>
  );
}

function ResultStat({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-sm">
      <div className="text-2xl">{icon}</div>
      <div className={`font-bold text-lg mt-1 ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
