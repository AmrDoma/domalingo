"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminKey } from "../../AdminKeyContext";
import LessonForm from "../LessonForm";
import { Lesson } from "@/types";

export default function EditLessonPage() {
  const { adminKey } = useAdminKey();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/lessons/${id}`)
      .then((r) => r.json())
      .then(setLesson)
      .catch(() => setError("Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (payload: Partial<Lesson>) => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/lessons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete lesson "${id}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/lessons/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });
    router.push("/admin/lessons");
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/lessons"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Lessons
          </Link>
          <span className="text-gray-300">/</span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {lesson ? `${lesson.emoji} ${lesson.title}` : id}
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{id}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-400 hover:text-red-600 font-medium disabled:opacity-40"
        >
          {deleting ? "Deleting…" : "🗑 Delete lesson"}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          ✅ Lesson saved successfully.
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="animate-spin size-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
          Loading…
        </div>
      ) : lesson ? (
        <LessonForm
          initial={lesson}
          onSave={handleSave}
          saving={saving}
          saveLabel="Save changes"
        />
      ) : (
        <p className="text-red-500 text-sm">Lesson not found.</p>
      )}
    </div>
  );
}
