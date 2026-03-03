"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminKey } from "../../AdminKeyContext";
import LessonForm from "../LessonForm";
import { Lesson } from "@/types";

export default function NewLessonPage() {
  const { adminKey } = useAdminKey();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (payload: Partial<Lesson>) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lesson");
      router.push(`/admin/lessons/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/lessons"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Lessons
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-extrabold text-gray-900">New lesson</h1>
      </div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}
      <LessonForm
        onSave={handleSave}
        saving={saving}
        saveLabel="Create lesson"
      />
    </div>
  );
}
