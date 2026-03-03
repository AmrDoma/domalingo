"use client";

import { BottomNav } from "./BottomNav";
import { GuestBanner } from "./GuestBanner";
import { Logo } from "@/components/ui/Logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto w-full px-4 h-14 flex items-center">
          <Logo className="h-8 w-auto" />
        </div>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-24">
        <GuestBanner />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
