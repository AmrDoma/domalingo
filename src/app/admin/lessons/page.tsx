"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminKey } from "../AdminKeyContext";
import { SUPPORTED_LANGUAGES } from "@/types";

interface LessonRow {
  id: string;
  language: string;
  category: string;
  title: string;
  description: string;
  emoji: string;
  imageSearch?: boolean;
  items?: unknown[];
}

export default function AdminLessonsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
      <LessonsContent />
    </Suspense>
  );
}

function LessonsContent() {
  const { adminKey } = useAdminKey();
  const router = useRouter();
  const searchParams = useSearchParams();
  const languageFilter = searchParams.get("language") ?? "";

  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchLessons = () => {
    setLoading(true);
    fetch("/api/admin/lessons", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then(setLessons)
      .catch(() => setError("Failed to load lessons"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLessons();
  }, [adminKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete lesson "${id}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/lessons/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });
    setDeleting(null);
    fetchLessons();
  };

  const filtered = lessons.filter((l) => {
    const matchLang = languageFilter ? l.language === languageFilter : true;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q);
    return matchLang && matchSearch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lessons</h1>
          <p className="text-sm text-gray-500">{filtered.length} lessons</p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          + New lesson
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-40 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={languageFilter}
          onChange={(e) =>
            router.replace(
              e.target.value
                ? `/admin/lessons?language=${e.target.value}`
                : "/admin/lessons",
            )
          }
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All languages</option>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-sm">No lessons found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.map((lesson, i) => {
            const lang = SUPPORTED_LANGUAGES.find(
              (l) => l.code === lesson.language,
            );
            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i < filtered.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0">
                  {lesson.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {lesson.title}
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                      {lesson.category}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                      {lang?.flag} {lang?.name ?? lesson.language}
                    </span>
                    {lesson.imageSearch && (
                      <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-0.5">
                        🖼️ images
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(lesson.items ?? []).length} words · {lesson.id}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/lessons/${lesson.id}`}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    disabled={deleting === lesson.id}
                    className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40"
                  >
                    {deleting === lesson.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
