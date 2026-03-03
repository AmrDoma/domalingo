"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/hooks/useLessons";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_LANGUAGES } from "@/types";

export default function DashboardPage() {
  const { profile, user, isGuest, loading } = useAuth();
  const router = useRouter();
  const { lessons, loading: lessonsLoading } = useLessons(
    profile?.activeLanguage,
  );

  useEffect(() => {
    if (!loading && !user && !isGuest) router.replace("/");
  }, [loading, user, isGuest, router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const lang = SUPPORTED_LANGUAGES.find(
    (l) => l.code === profile.activeLanguage,
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const practicedToday = profile.lastSessionDate === todayStr;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {profile.displayName.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Keep your streak alive!
          </p>
        </div>
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt="avatar"
            className="size-10 rounded-full border-2 border-indigo-200"
          />
        ) : (
          <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
            {profile.displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon="🔥" label="Streak" value={`${profile.streakCount}d`} />
        <StatCard
          icon="⭐"
          label="Total XP"
          value={`${profile.totalXP ?? 0}`}
        />
        <StatCard
          icon={lang?.flag ?? "🌍"}
          label="Language"
          value={lang?.name ?? profile.activeLanguage.toUpperCase()}
        />
      </div>

      {/* Daily practice CTA */}
      <div
        className={`rounded-2xl p-5 mb-6 ${
          practicedToday
            ? "bg-green-50 border border-green-200"
            : "bg-indigo-600 text-white"
        }`}
      >
        {practicedToday ? (
          <div className="text-center">
            <div className="text-3xl mb-1">🎉</div>
            <p className="font-semibold text-green-800">
              You already practiced today!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Come back tomorrow to keep your streak.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => router.push("/session")}
            >
              Practice again anyway
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-white">Time to practice!</p>
              <p className="text-indigo-200 text-sm mt-0.5">
                Your daily session is waiting.
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/session")}
              className="shrink-0 bg-white! text-indigo-600! hover:bg-indigo-50!"
            >
              Start →
            </Button>
          </div>
        )}
      </div>

      {/* Lessons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Lessons</h2>
          <button
            className="text-sm text-indigo-600 font-medium"
            onClick={() => router.push("/lessons")}
          >
            See all
          </button>
        </div>

        {lessonsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">
              No lessons found. Make sure you've run the seed script.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.slice(0, 4).map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 active:scale-98 cursor-pointer"
                onClick={() => router.push(`/lessons?id=${lesson.id}`)}
              >
                <div className="text-3xl">{lesson.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {lesson.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {lesson.description}
                  </p>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {lesson.itemCount} words
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
      <div className="text-2xl">{icon}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      <div className="font-bold text-gray-900 text-sm mt-0.5 truncate">
        {value}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
