"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { AdminKeyProvider, useAdminKey } from "./AdminKeyContext";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", emoji: "📊" },
  { href: "/admin/lessons", label: "Lessons", emoji: "📚" },
  { href: "/admin/users", label: "Users", emoji: "👤" },
  { href: "/admin/prompt", label: "AI Prompt", emoji: "🤖" },
  { href: "/admin/image-review", label: "Image Review", emoji: "🖼️" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminKeyProvider>
      <AdminShell>{children}</AdminShell>
    </AdminKeyProvider>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const { adminKey, setAdminKey } = useAdminKey();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-4xl mb-3">🔐</p>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Admin Panel
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your admin secret to continue
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!input.trim()) return;
              setChecking(true);
              setError("");
              // Verify the key against a lightweight endpoint
              const res = await fetch("/api/admin/stats", {
                headers: { "x-admin-key": input.trim() },
              });
              setChecking(false);
              if (res.ok) {
                setAdminKey(input.trim());
              } else {
                setError("Incorrect admin secret. Try again.");
              }
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="password"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin secret"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={checking}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {checking ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0 p-4 gap-1">
        <div className="mb-6 px-2">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            Domalingo
          </p>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href))
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <span className="text-lg">{item.emoji}</span>
            {item.label}
          </Link>
        ))}
        <div className="mt-auto">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <div>
          <span className="text-sm font-extrabold text-indigo-600">
            Domalingo Admin
          </span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-gray-50"
        >
          {mobileOpen ? (
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 6h18M3 12h18M3 18h18"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-14 bottom-0 w-56 bg-white p-4 flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href))
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <span className="text-lg">{item.emoji}</span>
                {item.label}
              </Link>
            ))}
            <div className="mt-auto">
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

function LogoutButton() {
  const { clearKey } = useAdminKey();
  return (
    <button
      onClick={clearKey}
      className="flex items-center gap-2 px-3 py-2.5 w-full rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
    >
      <span>🔓</span> Log out
    </button>
  );
}
