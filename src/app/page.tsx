"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const { user, isGuest, loading, signInWithGoogle, continueAsGuest } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (user || isGuest)) router.replace("/dashboard");
  }, [user, isGuest, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-linear-to-b from-indigo-50 to-white">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Hero */}
        <div className="text-center">
          <div className="text-7xl mb-4">🦜</div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Domalingo
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            A few minutes a day. Real vocabulary. Real progress.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            "🧠 Spaced Repetition",
            "🖼️ Images",
            "✍️ Fill in the blank",
            "🌍 Multiple Languages",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Primary CTA — Google sign in */}
        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            fullWidth
            className="gap-3 shadow-md"
            onClick={signInWithGoogle}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Value prop: why sign in */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-sm text-indigo-700 text-center">
            🔒 Signing in saves your progress, streaks, and XP across devices.
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Guest CTA */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={continueAsGuest}
          >
            Continue as Guest
          </Button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Guest sessions are not saved. Sign in later to keep your progress.
          </p>
        </div>

        <p className="text-xs text-gray-300 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
