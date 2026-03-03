"use client";

import { BottomNav } from "./BottomNav";
import { GuestBanner } from "./GuestBanner";

interface AppShellProps {
  children: React.ReactNode;
  /** Hide the bottom nav (e.g. during a session) */
  hideNav?: boolean;
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main
        className={`flex-1 max-w-lg mx-auto w-full px-4 pt-6 ${hideNav ? "pb-6" : "pb-24"}`}
      >
        <GuestBanner />
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
