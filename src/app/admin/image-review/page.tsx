"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminKey } from "../AdminKeyContext";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LessonItem {
  id: string;
  word: string;
  translation: string;
  article?: string;
  unsplashQuery?: string;
  imageUrl?: string;
  example?: string;
  exampleTranslation?: string;
}

interface Lesson {
  id: string;
  title: string;
  language: string;
  category: string;
  emoji: string;
  description: string;
  imageSearch?: boolean;
  imageSource?: "pexels" | "wikipedia";
  items: LessonItem[];
}

// ─── ImageCard ──────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: LessonItem;
  lesson: Lesson;
  adminKey: string;
  /**
   * Image URL pre-fetched by the parent via POST /api/images.
   * - `string`    → use this URL, skip the individual fetch
   * - `null`      → batch lookup found nothing, skip the fetch
   * - `undefined` → batch not done yet, fall back to individual fetch
   */
  prefetchedImageUrl?: string | null;
  /** called after a successful save so parent can update its state */
  onSaved: (
    lessonId: string,
    itemId: string,
    patch: { unsplashQuery?: string; imageUrl?: string | null },
  ) => void;
}

function buildProxyUrl(query: string, source: string, bust?: number) {
  const p = new URLSearchParams({ q: query, source });
  if (bust) p.set("bust", String(bust));
  return `/api/image-proxy?${p.toString()}`;
}

function ItemCard({ item, lesson, adminKey, prefetchedImageUrl, onSaved }: ItemCardProps) {
  const source = lesson.imageSource ?? "wikipedia";
  const initialQuery = item.unsplashQuery ?? item.word;
  const initialDirectUrl = item.imageUrl ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [directUrl, setDirectUrl] = useState(initialDirectUrl);
  const [showUrlField, setShowUrlField] = useState(!!initialDirectUrl);

  // "proxy" = showing auto-fetched image; "direct" = showing manual URL
  // If a pre-fetched URL was passed in, use it immediately.
  const [proxyImgSrc, setProxyImgSrc] = useState<string | null>(
    prefetchedImageUrl !== undefined ? prefetchedImageUrl : null,
  );
  const [proxyStatus, setProxyStatus] = useState<"loading" | "ok" | "error">(
    prefetchedImageUrl !== undefined
      ? prefetchedImageUrl
        ? "loading" // img will fire onLoad → "ok"
        : "error"
      : "loading",
  );
  const [directStatus, setDirectStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >(initialDirectUrl ? "loading" : "idle");

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error">("idle");

  // What to actually display: direct URL takes priority if set
  const usingDirect = !!directUrl.trim();
  const displaySrc = usingDirect ? directUrl.trim() : proxyImgSrc;
  const displayStatus = usingDirect ? directStatus : proxyStatus;

  const queryChanged = query.trim() !== initialQuery.trim();
  const urlChanged = directUrl.trim() !== initialDirectUrl.trim();
  const changed = queryChanged || urlChanged;

  // Fetch proxy JSON → extract real image URL
  async function fetchProxy(q: string) {
    setProxyStatus("loading");
    setProxyImgSrc(null);
    try {
      const res = await fetch(buildProxyUrl(q, source, Date.now()));
      const data = await res.json();
      if (data?.url) {
        setProxyImgSrc(data.url);
      } else {
        setProxyStatus("error");
      }
    } catch {
      setProxyStatus("error");
    }
  }

  // Load proxy on mount — skip if a pre-fetched URL was already provided
  useEffect(() => {
    if (prefetchedImageUrl !== undefined) return;
    fetchProxy(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function testQuery() {
    if (!query.trim()) return;
    fetchProxy(query.trim());
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaveStatus("idle");

    const trimmedQuery = query.trim();
    const trimmedUrl = directUrl.trim();

    const patch: { unsplashQuery?: string; imageUrl?: string | null } = {};
    if (queryChanged) patch.unsplashQuery = trimmedQuery;
    if (urlChanged) patch.imageUrl = trimmedUrl || null; // null clears it

    const updatedItems = lesson.items.map((it) =>
      it.id === item.id
        ? {
            ...it,
            unsplashQuery: trimmedQuery,
            ...(trimmedUrl
              ? { imageUrl: trimmedUrl }
              : { imageUrl: undefined }),
          }
        : it,
    );

    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ ...lesson, items: updatedItems }),
      });

      if (res.ok) {
        setSaveStatus("ok");
        onSaved(lesson.id, item.id, patch);
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Image area */}
      <div className="relative w-full h-40 bg-gray-100 shrink-0">
        {displayStatus === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {displayStatus === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
            <span className="text-2xl">🖼️</span>
            <span className="text-xs">No image found</span>
          </div>
        ) : displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={displaySrc}
            src={displaySrc}
            alt={item.word}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              displayStatus === "loading" ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() =>
              usingDirect ? setDirectStatus("ok") : setProxyStatus("ok")
            }
            onError={() =>
              usingDirect ? setDirectStatus("error") : setProxyStatus("error")
            }
          />
        ) : null}

        {/* Badges */}
        <span
          className={`absolute top-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            usingDirect
              ? "bg-purple-100 text-purple-700"
              : source === "pexels"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          {usingDirect ? "manual" : source}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            {item.article ? (
              <span className="text-gray-400 font-normal">{item.article} </span>
            ) : null}
            {item.word}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{item.translation}</p>
        </div>

        {/* Query input */}
        <input
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 font-mono bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSaveStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") testQuery();
          }}
          placeholder="search query…"
        />

        {/* Manual URL toggle + field */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setShowUrlField((v) => !v)}
            className="text-[11px] text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1"
          >
            <span
              className={`transition-transform duration-150 ${showUrlField ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            {directUrl ? "Manual URL set" : "Set manual URL"}
            {directUrl && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
            )}
          </button>
          {showUrlField && (
            <div className="flex gap-1">
              <input
                className="flex-1 text-xs border border-purple-200 rounded-lg px-2.5 py-1.5 font-mono bg-purple-50 focus:outline-none focus:border-purple-400 focus:bg-white transition-colors"
                value={directUrl}
                onChange={(e) => {
                  setDirectUrl(e.target.value);
                  setSaveStatus("idle");
                  // reset direct status so img re-loads
                  setDirectStatus(e.target.value.trim() ? "loading" : "idle");
                }}
                placeholder="https://…"
              />
              {directUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setDirectUrl("");
                    setDirectStatus("idle");
                    setSaveStatus("idle");
                  }}
                  className="text-xs px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear manual URL"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={testQuery}
            className="flex-1 text-xs px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            🔍 Test
          </button>
          <button
            onClick={save}
            disabled={saving || !changed}
            className={`flex-1 text-xs px-2 py-1.5 rounded-lg transition-colors font-medium ${
              saveStatus === "ok"
                ? "bg-green-100 text-green-700"
                : saveStatus === "error"
                  ? "bg-red-100 text-red-600"
                  : changed
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving
              ? "…"
              : saveStatus === "ok"
                ? "✓ Saved"
                : saveStatus === "error"
                  ? "✗ Error"
                  : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ImageReviewPage() {
  const { adminKey } = useAdminKey();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Pre-fetched image URLs keyed by "query:source"
  const [imageCache, setImageCache] = useState<Map<string, string | null>>(
    new Map(),
  );
  const [filterLesson, setFilterLesson] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("domalingo_img_review_collapsed");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(
        "domalingo_img_review_collapsed",
        JSON.stringify([...collapsedIds]),
      );
    } catch {
      /* ignore */
    }
  }, [collapsedIds]);

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function collapseAll() {
    setCollapsedIds(new Set(lessons.map((l) => l.id)));
  }

  function expandAll() {
    setCollapsedIds(new Set());
  }

  // load all lessons with imageSearch
  useEffect(() => {
    if (!adminKey) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/lessons", {
          headers: { "x-admin-key": adminKey },
        });
        if (!res.ok) throw new Error("Failed to load lessons");
        const data: Lesson[] = await res.json();
        const filtered = data.filter((l) => l.imageSearch);
        setLessons(filtered);

        // Batch-fetch all images in one POST /api/images request.
        // Deduplicate by "query:source" to avoid redundant API calls.
        try {
          const seen = new Set<string>();
          const lookups: { q: string; source: string }[] = [];
          for (const lesson of filtered) {
            const src = lesson.imageSource ?? "wikipedia";
            for (const it of lesson.items) {
              const q = (it.unsplashQuery ?? it.word).trim();
              const key = `${q}:${src}`;
              if (!seen.has(key)) {
                seen.add(key);
                lookups.push({ q, source: src });
              }
            }
          }
          if (lookups.length > 0) {
            const batchRes = (await fetch("/api/images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: lookups }),
            }).then((r) => r.json())) as { q: string; url: string | null }[];

            const cache = new Map<string, string | null>();
            batchRes.forEach((result, idx) => {
              cache.set(`${result.q}:${lookups[idx].source}`, result.url);
            });
            setImageCache(cache);
          }
        } catch {
          /* silently fail — ItemCard will fetch individually as fallback */
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [adminKey]);

  // update item fields in local state after save
  const handleSaved = useCallback(
    (
      lessonId: string,
      itemId: string,
      patch: { unsplashQuery?: string; imageUrl?: string | null },
    ) => {
      setLessons((prev) =>
        prev.map((l) =>
          l.id !== lessonId
            ? l
            : {
                ...l,
                items: l.items.map((it) => {
                  if (it.id !== itemId) return it;
                  const updated = { ...it };
                  if (patch.unsplashQuery !== undefined)
                    updated.unsplashQuery = patch.unsplashQuery;
                  if (patch.imageUrl !== undefined)
                    updated.imageUrl = patch.imageUrl ?? undefined;
                  return updated;
                }),
              },
        ),
      );
    },
    [],
  );

  // all items across filtered lessons
  const { flatItems, totalItems } = useMemo(() => {
    const srcLessons =
      filterLesson === "all"
        ? lessons
        : lessons.filter((l) => l.id === filterLesson);

    const q = search.trim().toLowerCase();
    const flat = srcLessons.flatMap((lesson) =>
      lesson.items
        .filter(
          (item) =>
            !q ||
            item.word.toLowerCase().includes(q) ||
            item.translation.toLowerCase().includes(q) ||
            (item.unsplashQuery ?? "").toLowerCase().includes(q),
        )
        .map((item) => ({ lesson, item })),
    );

    return { flatItems: flat, totalItems: flat.length };
  }, [lessons, filterLesson, search]);

  // stats
  const totalWords = useMemo(
    () => lessons.reduce((s, l) => s + l.items.length, 0),
    [lessons],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-60">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading image lessons…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-xl text-sm">
        {error}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-4xl mb-3">🖼️</p>
        <p className="text-lg font-medium">No image lessons found</p>
        <p className="text-sm mt-1">
          Enable <code className="bg-gray-100 px-1 rounded">imageSearch</code>{" "}
          on a lesson to use this tool.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🖼️ Image Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          Preview and fix image search queries for all image-enabled lessons.
          Edit the query and click <strong>Test</strong> to preview, then{" "}
          <strong>Save</strong> to persist.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {[
          { label: "Lessons", value: lessons.length },
          { label: "Total words", value: totalWords },
          {
            label: "Reviewed",
            value: collapsedIds.size,
            highlight: collapsedIds.size > 0,
          },
          {
            label: "Pending",
            value: lessons.length - collapsedIds.size,
            warning: lessons.length - collapsedIds.size > 0,
          },
        ].map(({ label, value, highlight, warning }) => (
          <div
            key={label}
            className={`border rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm ${
              highlight
                ? "bg-green-50 border-green-200"
                : warning
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-gray-200"
            }`}
          >
            <span
              className={`text-xl font-bold ${
                highlight
                  ? "text-green-700"
                  : warning
                    ? "text-amber-700"
                    : "text-gray-900"
              }`}
            >
              {value}
            </span>
            <span
              className={`text-xs ${
                highlight
                  ? "text-green-600"
                  : warning
                    ? "text-amber-600"
                    : "text-gray-500"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={expandAll}
            disabled={collapsedIds.size === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            disabled={collapsedIds.size === lessons.length}
            className="text-xs px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ✓ Mark all reviewed
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="flex-1 min-w-48 text-sm border border-gray-200 rounded-xl px-3.5 py-2 bg-white focus:outline-none focus:border-blue-400 transition-colors"
          placeholder="Search word, translation, or query…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 bg-white focus:outline-none focus:border-blue-400 transition-colors"
          value={filterLesson}
          onChange={(e) => setFilterLesson(e.target.value)}
        >
          <option value="all">All lessons</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.emoji} {l.title} ({l.language})
            </option>
          ))}
        </select>
      </div>

      {/* Lesson sections */}
      {(filterLesson === "all"
        ? lessons
        : lessons.filter((l) => l.id === filterLesson)
      ).map((lesson) => {
        const q = search.trim().toLowerCase();
        const items = lesson.items.filter(
          (item) =>
            !q ||
            item.word.toLowerCase().includes(q) ||
            item.translation.toLowerCase().includes(q) ||
            (item.unsplashQuery ?? "").toLowerCase().includes(q),
        );
        if (items.length === 0) return null;

        const isCollapsed = collapsedIds.has(lesson.id);

        return (
          <section key={lesson.id} className="space-y-2">
            {/* Lesson header — clickable toggle */}
            <button
              onClick={() => toggleCollapse(lesson.id)}
              className={`w-full flex items-center gap-3 pt-2 pb-2 px-3 rounded-xl transition-colors text-left group ${
                isCollapsed
                  ? "bg-green-50 hover:bg-green-100 border border-green-200"
                  : "bg-white hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span className="text-2xl">{lesson.emoji}</span>
              <div className="flex-1">
                <h2
                  className={`text-base font-semibold leading-tight ${
                    isCollapsed ? "text-green-800" : "text-gray-900"
                  }`}
                >
                  {lesson.title}
                  {isCollapsed && (
                    <span className="ml-2 text-xs font-normal text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                      ✓ reviewed
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500">
                  {lesson.language.toUpperCase()} · {lesson.category} ·{" "}
                  <span
                    className={`font-medium ${
                      (lesson.imageSource ?? "wikipedia") === "pexels"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {lesson.imageSource ?? "wikipedia"}
                  </span>{" "}
                  · {items.length} items
                </p>
              </div>
              <span
                className={`text-gray-400 text-sm transition-transform duration-200 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {/* Cards grid — hidden when collapsed */}
            {!isCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-1">
                {items.map((item) => {
                  const q = (item.unsplashQuery ?? item.word).trim();
                  const src = lesson.imageSource ?? "wikipedia";
                  const cacheKey = `${q}:${src}`;
                  return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    lesson={lesson}
                    adminKey={adminKey!}
                    onSaved={handleSaved}
                    prefetchedImageUrl={
                      imageCache.has(cacheKey)
                        ? imageCache.get(cacheKey)
                        : undefined
                    }
                  />
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {totalItems === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No results match your search.
        </div>
      )}
    </div>
  );
}
