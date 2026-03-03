"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/hooks/useLessons";
import { AppShell } from "@/components/layout/AppShell";
import { SUPPORTED_LANGUAGES } from "@/types";

export default function LessonsPage() {
  const { user, isGuest, loading: authLoading, profile } = useAuth();
  const router = useRouter();
  const { lessons, loading, error } = useLessons(profile?.activeLanguage);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user && !isGuest) router.replace("/");
  }, [authLoading, user, isGuest, router]);

  const lang = SUPPORTED_LANGUAGES.find(
    (l) => l.code === profile?.activeLanguage,
  );

  const filtered = lessons.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {lang ? `${lang.flag} ${lang.name}` : "—"} · {lessons.length} lessons
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx={11} cy={11} r={8} />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search lessons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-2">⚠️</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-2">{search ? "🔍" : "📭"}</p>
          <p className="text-gray-500 text-sm">
            {search
              ? `No lessons matching "${search}"`
              : "No lessons yet. Run the seed script!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 cursor-pointer active:scale-98 transition-transform"
              onClick={() => router.push(`/session?lesson=${lesson.id}`)}
            >
              <div className="size-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0">
                {lesson.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {lesson.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {lesson.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                    {lesson.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {lesson.itemCount} words
                  </span>
                </div>
              </div>
              <svg
                className="size-4 text-gray-300 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 18l6-6-6-6"
                />
              </svg>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
