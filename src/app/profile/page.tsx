"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/types";
import { api } from "@/lib/api-client";
import { useLessons } from "@/hooks/useLessons";

export default function ProfilePage() {
  const {
    user,
    isGuest,
    loading: authLoading,
    profile,
    refreshProfile,
    signOut,
  } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingExclusions, setSavingExclusions] = useState(false);
  const [excludedLessons, setExcludedLessons] = useState<string[]>([]);

  const { lessons } = useLessons(profile?.activeLanguage);

  // Sync excluded lessons from profile
  useEffect(() => {
    if (profile?.excludedLessons) {
      setExcludedLessons(profile.excludedLessons);
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) router.replace("/");
  }, [authLoading, user, isGuest, router]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  async function handleLanguageChange(code: LanguageCode) {
    if (!profile || profile.activeLanguage === code) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.updateProfile({ activeLanguage: code });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  async function toggleLessonExclusion(lessonId: string) {
    const next = excludedLessons.includes(lessonId)
      ? excludedLessons.filter((id) => id !== lessonId)
      : [...excludedLessons, lessonId];
    setExcludedLessons(next);
    setSavingExclusions(true);
    try {
      await api.updateExcludedLessons(next);
      await refreshProfile();
    } finally {
      setSavingExclusions(false);
    }
  }

  return (
    <AppShell>
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt="avatar"
            className="size-20 rounded-full border-4 border-indigo-200"
          />
        ) : (
          <div className="size-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
            {profile.displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">
            {profile.displayName}
          </h1>
          {profile.email && (
            <p className="text-sm text-gray-500">{profile.email}</p>
          )}
          {isGuest && (
            <span className="mt-1 inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Guest
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Streak"
          value={`${profile.streakCount}`}
          suffix="days"
          icon="🔥"
        />
        <StatCard
          label="Total XP"
          value={`${profile.totalXP ?? 0}`}
          suffix="xp"
          icon="⭐"
        />
        <StatCard
          label="Languages"
          value={`${profile.targetLanguages?.length ?? 1}`}
          suffix="active"
          icon="🌍"
        />
      </div>

      {/* Language selection */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Learning language
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = profile.activeLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={saving}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-medium transition-colors ${
                  isActive
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="truncate">{lang.name}</span>
                {isActive && (
                  <svg
                    className="size-4 ml-auto shrink-0 text-indigo-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        {saved && (
          <p className="text-xs text-green-600 mt-2 text-center font-medium">
            ✓ Language updated!
          </p>
        )}
      </section>

      {/* Excluded lessons */}
      {!isGuest && lessons.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Hidden from practice
            </h2>
            {savingExclusions && (
              <span className="text-xs text-gray-400">Saving…</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Toggle lessons you want to skip in Daily Review and Weak Words
            modes.
          </p>
          <div className="flex flex-col gap-2">
            {lessons.map((lesson) => {
              const excluded = excludedLessons.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  onClick={() => toggleLessonExclusion(lesson.id)}
                  disabled={savingExclusions}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-medium transition-colors text-left ${
                    excluded
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="text-xl">{lesson.emoji}</span>
                  <span className="flex-1 truncate">{lesson.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      excluded
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {excluded ? "Hidden" : "Active"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="flex flex-col gap-3">
        {isGuest ? (
          <Button fullWidth size="lg" onClick={() => router.push("/")}>
            Sign in to save progress
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            variant="ghost"
            className="text-red-500 border border-red-200 hover:bg-red-50"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        )}
      </section>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: string;
  suffix: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{suffix}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
