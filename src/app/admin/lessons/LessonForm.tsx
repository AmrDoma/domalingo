"use client";

import { useState } from "react";
import { Lesson, LessonItem, SUPPORTED_LANGUAGES, LanguageCode } from "@/types";
import { cn } from "@/lib/utils";

interface LessonFormProps {
  initial?: Partial<Lesson>;
  onSave: (lesson: Partial<Lesson>) => Promise<void>;
  saving: boolean;
  saveLabel?: string;
}

const CATEGORIES = [
  "room",
  "kitchen",
  "colors",
  "directions",
  "numbers",
  "verbs",
  "adjectives",
  "devices",
  "food",
  "body",
  "clothing",
  "transport",
  "nature",
  "time",
];

export default function LessonForm({
  initial = {},
  onSave,
  saving,
  saveLabel = "Save",
}: LessonFormProps) {
  const [tab, setTab] = useState<"form" | "json">("form");
  const [language, setLanguage] = useState(initial.language ?? "de");
  const [category, setCategory] = useState(initial.category ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [emoji, setEmoji] = useState(initial.emoji ?? "");
  const [imageSearch, setImageSearch] = useState(initial.imageSearch ?? false);
  const [imageSource, setImageSource] = useState<"wikipedia" | "pexels">(
    initial.imageSource ?? "wikipedia",
  );
  const [items, setItems] = useState<LessonItem[]>(initial.items ?? []);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  // ── Item editing ──
  const updateItem = (idx: number, field: keyof LessonItem, val: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)),
    );
  };
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: "", word: "", translation: "", article: "" },
    ]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  // ── JSON tab: parse and populate form ──
  const applyJson = () => {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonText) as Partial<Lesson>;
      if (parsed.language) setLanguage(parsed.language);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.emoji) setEmoji(parsed.emoji);
      if (typeof parsed.imageSearch === "boolean")
        setImageSearch(parsed.imageSearch);
      if (parsed.imageSource) setImageSource(parsed.imageSource);
      if (parsed.items) setItems(parsed.items);
      setTab("form");
    } catch {
      setJsonError("Invalid JSON. Check your input and try again.");
    }
  };

  const buildPayload = (): Partial<Lesson> => ({
    language: language as Lesson["language"],
    category: category as Lesson["category"],
    title,
    description,
    emoji,
    imageSearch,
    imageSource,
    items,
  });

  const handleSave = () => onSave(buildPayload());

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["form", "json"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {t === "json" ? "📋 Paste JSON" : "📝 Editor"}
          </button>
        ))}
      </div>

      {tab === "json" ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Paste a lesson JSON object. It will populate the editor fields.
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={14}
            placeholder={`{\n  "language": "de",\n  "category": "food",\n  "title": "At the Restaurant",\n  "description": "Order like a local",\n  "emoji": "🍽️",\n  "items": [\n    { "id": "steak", "word": "das Steak", "translation": "steak" }\n  ]\n}`}
            className="w-full font-mono text-xs px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
          />
          {jsonError && <p className="text-sm text-red-500">{jsonError}</p>}
          <button
            onClick={applyJson}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
          >
            Parse & populate editor
          </button>
        </div>
      ) : (
        <>
          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Language">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                  className={fieldCls}
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={fieldCls}
                >
                  <option value="">— select —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={fieldCls}
                  placeholder="e.g. At the Restaurant"
                />
              </Field>
              <Field label="Emoji">
                <input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className={fieldCls}
                  placeholder="🍽️"
                />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={fieldCls}
                  placeholder="Short description shown on the lesson card"
                />
              </Field>
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={imageSearch}
                  onChange={(e) => setImageSearch(e.target.checked)}
                  className="size-4 rounded"
                />
                <span className="text-sm text-gray-700 font-medium">
                  Enable image exercises
                </span>
              </label>
              {imageSearch && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Source:</span>
                  <select
                    value={imageSource}
                    onChange={(e) =>
                      setImageSource(e.target.value as "wikipedia" | "pexels")
                    }
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="wikipedia">Wikipedia (nouns)</option>
                    <option value="pexels">Pexels (actions/verbs)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Words ({items.length})
              </h3>
              <button
                onClick={addItem}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                + Add word
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-xl p-3"
                >
                  <div className="col-span-2">
                    <input
                      value={item.id}
                      onChange={(e) => updateItem(idx, "id", e.target.value)}
                      className={itemFieldCls}
                      placeholder="id"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      value={item.article ?? ""}
                      onChange={(e) =>
                        updateItem(idx, "article", e.target.value)
                      }
                      className={itemFieldCls}
                      placeholder="article"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      value={item.word}
                      onChange={(e) => updateItem(idx, "word", e.target.value)}
                      className={itemFieldCls}
                      placeholder="word"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      value={item.translation}
                      onChange={(e) =>
                        updateItem(idx, "translation", e.target.value)
                      }
                      className={itemFieldCls}
                      placeholder="translation"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      value={item.unsplashQuery ?? ""}
                      onChange={(e) =>
                        updateItem(idx, "unsplashQuery", e.target.value)
                      }
                      className={itemFieldCls}
                      placeholder="image query"
                    />
                  </div>
                  <div className="col-span-12 grid grid-cols-2 gap-2">
                    <input
                      value={item.example ?? ""}
                      onChange={(e) =>
                        updateItem(idx, "example", e.target.value)
                      }
                      className={itemFieldCls}
                      placeholder="example sentence"
                    />
                    <div className="flex gap-2">
                      <input
                        value={item.exampleTranslation ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "exampleTranslation", e.target.value)
                        }
                        className={cn(itemFieldCls, "flex-1")}
                        placeholder="example translation"
                      />
                      <button
                        onClick={() => removeItem(idx)}
                        className="shrink-0 size-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  No words yet. Click "+ Add word" to start.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || tab === "json"}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

const fieldCls =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";
const itemFieldCls =
  "w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
