"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import type { WordStats } from "@/app/api/words/route";

export default function WeakWordsPage() {
  const { user, isGuest, loading: authLoading, profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<WordStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) router.replace("/");
  }, [authLoading, user, isGuest, router]);

  useEffect(() => {
    if (!profile?.activeLanguage) return;
    setLoading(true);
    api
      .getWordStats(profile.activeLanguage)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [profile?.activeLanguage]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
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
          <h1 className="text-xl font-bold text-gray-900">Weak Words</h1>
          <p className="text-xs text-gray-400">
            Words you've been struggling with
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin size-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
        </div>
      ) : !stats || stats.weakWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="text-5xl">🎉</span>
          <p className="font-semibold text-gray-700">No weak words!</p>
          <p className="text-sm text-gray-400">
            Keep practising and any words you struggle with will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              {stats.weakWords.length} word
              {stats.weakWords.length !== 1 ? "s" : ""} to review
            </span>
            <button
              onClick={() => router.push("/session?mode=weak")}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Practice all →
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {stats.weakWords.map((w) => (
              <div
                key={w.cardId}
                className="flex items-center gap-3 bg-white rounded-2xl border border-red-100 px-4 py-3 shadow-sm"
              >
                <span className="text-xl shrink-0">{w.lessonEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {w.article ? `${w.article} ` : ""}
                    {w.word}
                  </p>
                  <p className="text-xs text-gray-400">{w.translation}</p>
                </div>
                <span className="text-xs text-gray-300 shrink-0">
                  {w.lessonTitle}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
