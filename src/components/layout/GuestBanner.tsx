"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function GuestBanner() {
  const { isGuest, signInWithGoogle } = useAuth();

  if (!isGuest) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 mb-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          You&apos;re in guest mode
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          Sign in to save your progress, streak, and XP.
        </p>
      </div>
      <Button
        size="sm"
        variant="primary"
        className="shrink-0 bg-amber-500! hover:bg-amber-600!"
        onClick={signInWithGoogle}
      >
        Sign in
      </Button>
    </div>
  );
}
