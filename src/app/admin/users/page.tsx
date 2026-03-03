"use client";

import { useEffect, useState } from "react";
import { useAdminKey } from "../AdminKeyContext";
import { SUPPORTED_LANGUAGES } from "@/types";

interface UserRow {
  uid: string;
  displayName: string;
  email: string;
  activeLanguage: string;
  streakCount: number;
  totalXP: number;
  lastSessionDate: string | null;
  createdAt: number | null;
}

export default function AdminUsersPage() {
  const { adminKey } = useAdminKey();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, [adminKey]);

  const filtered = users.filter(
    (u) =>
      !search ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalXP = users.reduce((s, u) => s + u.totalXP, 0);
  const activeToday = users.filter(
    (u) => u.lastSessionDate === new Date().toISOString().slice(0, 10),
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{users.length} total users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total users", value: users.length, emoji: "👤" },
          { label: "Active today", value: activeToday, emoji: "🔥" },
          {
            label: "Total XP earned",
            value: totalXP.toLocaleString(),
            emoji: "⭐",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
          >
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="animate-spin size-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
          Loading…
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-2 text-right">XP</div>
            <div className="col-span-2 text-right">Streak</div>
            <div className="col-span-2 text-right">Last session</div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No users found.
            </div>
          ) : (
            filtered.map((user, i) => {
              const lang = SUPPORTED_LANGUAGES.find(
                (l) => l.code === user.activeLanguage,
              );
              return (
                <div
                  key={user.uid}
                  className={`grid grid-cols-12 gap-4 items-center px-5 py-3.5 text-sm ${
                    i < filtered.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="col-span-4 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {lang ? `${lang.flag} ${lang.name}` : user.activeLanguage}
                  </div>
                  <div className="col-span-2 text-right font-semibold text-gray-900">
                    {user.totalXP.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right text-gray-600">
                    {user.streakCount}🔥
                  </div>
                  <div className="col-span-2 text-right text-xs text-gray-400">
                    {user.lastSessionDate ?? "Never"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
