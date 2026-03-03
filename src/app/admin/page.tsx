"use client";

import { useEffect, useState } from "react";
import { useAdminKey } from "./AdminKeyContext";
import { SUPPORTED_LANGUAGES } from "@/types";
import Link from "next/link";

interface Stats {
  totalLessons: number;
  totalUsers: number;
  totalWords: number;
  lessonsByLanguage: Record<string, number>;
}

export default function AdminOverviewPage() {
  const { adminKey } = useAdminKey();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, [adminKey]);

  if (loading)
    return (
      <div className="flex items-center gap-3 text-gray-400 text-sm">
        <div className="animate-spin size-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
        Loading…
      </div>
    );
  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Overview</h1>
      <p className="text-sm text-gray-500 mb-8">
        At-a-glance stats for Domalingo.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {[
          { emoji: "📚", label: "Lessons", value: stats.totalLessons },
          { emoji: "📝", label: "Total Words", value: stats.totalWords },
          { emoji: "👤", label: "Users", value: stats.totalUsers },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <p className="text-3xl mb-2">{s.emoji}</p>
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lessons per language */}
      <h2 className="text-base font-bold text-gray-900 mb-3">
        Lessons by language
      </h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-10">
        {Object.entries(stats.lessonsByLanguage).map(([code, count]) => {
          const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
          return (
            <div
              key={code}
              className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm font-medium text-gray-800">
                {lang ? `${lang.flag} ${lang.name}` : code}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{count} lessons</span>
                <Link
                  href={`/admin/lessons?language=${code}`}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  View →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <h2 className="text-base font-bold text-gray-900 mb-3">Quick actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            href: "/admin/lessons/new",
            emoji: "➕",
            label: "New lesson",
            desc: "Create a lesson manually",
          },
          {
            href: "/admin/prompt",
            emoji: "🤖",
            label: "AI import",
            desc: "Paste GenAI JSON to create a lesson",
          },
          {
            href: "/admin/users",
            emoji: "👥",
            label: "View users",
            desc: "See all registered users",
          },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">{a.emoji}</p>
            <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
            <p className="text-xs text-gray-500">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
