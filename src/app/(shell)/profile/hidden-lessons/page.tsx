"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/hooks/useLessons";
import { api } from "@/lib/api-client";

export default function HiddenLessonsPage() {
  const {
    user,
    isGuest,
    loading: authLoading,
    profile,
    refreshProfile,
  } = useAuth();
  const router = useRouter();
  const { lessons, loading: lessonsLoading } = useLessons(
    profile?.activeLanguage,
  );

  const [excluded, setExcluded] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Track original so we can detect changes
  const original = useRef<string[]>([]);

  // Initialise from profile once loaded
  useEffect(() => {
    if (profile?.excludedLessons !== undefined) {
      setExcluded(profile.excludedLessons ?? []);
      original.current = profile.excludedLessons ?? [];
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) router.replace("/");
  }, [authLoading, user, isGuest, router]);

  // Warn native browser close/refresh when dirty
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function toggle(lessonId: string) {
    setExcluded((prev) => {
      const next = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      const changed =
        JSON.stringify([...next].sort()) !==
        JSON.stringify([...original.current].sort());
      setIsDirty(changed);
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await api.updateExcludedLessons(excluded);
      await refreshProfile();
      original.current = excluded;
      setIsDirty(false);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleBack() {
    if (isDirty) await save();
    router.back();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-1 -ml-1 text-gray-400 hover:text-gray-600"
          aria-label="Back"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hidden from Practice
          </h1>
          <p className="text-xs text-gray-400">
            Excluded from Daily Review and Weak Words modes
          </p>
        </div>
      </div>

      {lessonsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin size-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="text-5xl">📭</span>
          <p className="text-sm text-gray-400">No lessons available yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-28">
          {/* Toggle all */}
          <button
            onClick={() => {
              const allExcluded = lessons.every((l) => excluded.includes(l.id));
              const next = allExcluded ? [] : lessons.map((l) => l.id);
              const changed =
                JSON.stringify([...next].sort()) !==
                JSON.stringify([...original.current].sort());
              setExcluded(next);
              setIsDirty(changed);
              setSaved(false);
            }}
            className="flex items-center justify-between rounded-2xl px-4 py-3 border border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors"
          >
            <span>
              {lessons.every((l) => excluded.includes(l.id))
                ? "Enable all lessons"
                : "Hide all lessons"}
            </span>
            <span className="text-xs text-gray-400">
              {excluded.length}/{lessons.length} hidden
            </span>
          </button>

          {lessons.map((lesson) => {
            const isExcluded = excluded.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => toggle(lesson.id)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 border text-sm font-medium transition-colors text-left ${
                  isExcluded
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-2xl shrink-0">{lesson.emoji}</span>
                <span className="flex-1 truncate text-gray-800">
                  {lesson.title}
                </span>
                {/* Toggle pill */}
                <span
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                    isExcluded ? "bg-red-400" : "bg-indigo-400"
                  }`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                      isExcluded ? "translate-x-0.5" : "translate-x-5"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sticky save bar */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 transition-all duration-300 ${
          isDirty
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl py-3.5 shadow-lg transition-colors disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>

      {saved && !isDirty && (
        <p className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1 shadow">
          ✓ Saved
        </p>
      )}
    </>
  );
}
