"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ModeCard {
  mode?: string;
  href: string;
  emoji: string;
  label: string;
  description: string;
  color: string;
  borderColor: string;
  textColor: string;
  badge?: string;
  badgeColor?: string;
}

const MODES: ModeCard[] = [
  {
    mode: "daily",
    href: "/session?mode=daily",
    emoji: "📅",
    label: "Daily Review",
    description:
      "Your SRS queue — words due for review today based on spaced repetition.",
    color: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    badge: "Recommended",
    badgeColor: "bg-indigo-100 text-indigo-600",
  },
  {
    mode: "weak",
    href: "/session?mode=weak",
    emoji: "🔥",
    label: "Weak Words",
    description: "Words you've struggled with. Practice them until they stick.",
    color: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
  },
  {
    mode: "new",
    href: "/session?mode=new",
    emoji: "✨",
    label: "Learn New",
    description:
      "Brand new vocabulary you haven't studied yet. Expand your knowledge.",
    color: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
  },
  {
    href: "/lessons",
    emoji: "📚",
    label: "By Lesson",
    description: "Browse all lessons and pick a specific topic to practice.",
    color: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
];

export default function PracticePage() {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !isGuest) router.replace("/");
  }, [loading, user, isGuest, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Practice</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose how you want to study today.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {MODES.map((card) => (
          <button
            key={card.label}
            onClick={() => router.push(card.href)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-98 cursor-pointer ${card.color} ${card.borderColor} hover:shadow-md`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl shrink-0">{card.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-lg font-bold ${card.textColor}`}>
                    {card.label}
                  </h2>
                  {card.badge && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5 leading-snug">
                  {card.description}
                </p>
              </div>
              <div className={`text-xl shrink-0 mt-1 ${card.textColor}`}>→</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
