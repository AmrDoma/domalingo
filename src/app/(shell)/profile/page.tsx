"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api-client";
import type { WordStats } from "@/app/api/words/route";

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
  const [wordStats, setWordStats] = useState<WordStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch word stats
  useEffect(() => {
    if (!profile?.activeLanguage || isGuest) return;
    setLoadingStats(true);
    api
      .getWordStats(profile.activeLanguage)
      .then(setWordStats)
      .catch(() => setWordStats(null))
      .finally(() => setLoadingStats(false));
  }, [profile?.activeLanguage, isGuest]);

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

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  const hiddenCount = profile.excludedLessons?.length ?? 0;
  const weakCount = wordStats?.weakWords.length ?? 0;

  return (
    <>
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
      <div className="grid grid-cols-2 gap-3 mb-8">
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
      </div>

      {/* Vocabulary progress */}
      {!isGuest && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Vocabulary Progress
          </h2>
          {loadingStats ? (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-center h-24">
              <div className="animate-spin size-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
            </div>
          ) : wordStats ? (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-indigo-600">
                    {wordStats.encountered}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Encountered
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-500">
                    {wordStats.remaining}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-700">
                    {wordStats.total}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Total</div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width:
                      wordStats.total > 0
                        ? `${Math.round((wordStats.encountered / wordStats.total) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right mt-1">
                {wordStats.total > 0
                  ? `${Math.round((wordStats.encountered / wordStats.total) * 100)}% of vocabulary unlocked`
                  : "Start a session to begin"}
              </p>
            </div>
          ) : null}
        </section>
      )}

      {/* Quick links */}
      {!isGuest && (
        <section className="mb-6 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Vocabulary
          </h2>
          <NavRow
            emoji="🔴"
            label="Weak Words"
            description="Words you've been struggling with"
            badge={weakCount > 0 ? String(weakCount) : undefined}
            badgeColor="bg-red-100 text-red-600"
            onClick={() => router.push("/profile/weak-words")}
          />
          <NavRow
            emoji="🚫"
            label="Hidden from Practice"
            description="Lessons excluded from Daily & Weak modes"
            badge={hiddenCount > 0 ? `${hiddenCount} hidden` : undefined}
            badgeColor="bg-gray-100 text-gray-500"
            onClick={() => router.push("/profile/hidden-lessons")}
          />
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
    </>
  );
}

function NavRow({
  emoji,
  label,
  description,
  badge,
  badgeColor,
  onClick,
}: {
  emoji: string;
  label: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-left hover:border-indigo-200 transition-colors w-full"
    >
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>
      {badge && (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}
        >
          {badge}
        </span>
      )}
      <svg
        className="size-4 text-gray-300 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      </svg>
    </button>
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
