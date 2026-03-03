"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminKey } from "../AdminKeyContext";
import { Lesson } from "@/types";
import { cn } from "@/lib/utils";

const PROMPT_TEMPLATE = `You are generating lesson data for a language learning app called Domalingo.

Generate a lesson JSON object for the following topic: [TOPIC]

Language: [LANGUAGE CODE e.g. "de", "fr", "es"]

Rules:
- The "id" field should be snake_case: {language}_{category}_{topic}
- "category" must be one of: room, kitchen, colors, directions, numbers, verbs, adjectives, devices, food, body, clothing, transport, nature, time
- Each item must have: id (snake_case English noun), word (in target language with article if applicable), translation (English)
- Optional item fields: article (e.g. "der"/"die"/"das" for German), example (sentence in target language), exampleTranslation, unsplashQuery (2-3 word English image search)
- Include 8-12 items
- Set "imageSearch": true if items are concrete nouns/actions that can be photographed
- Set "imageSource": "pexels" for actions/verbs, "wikipedia" for concrete nouns

Return ONLY valid JSON, no markdown, no explanation.

Example output format:
{
  "id": "de_food_fruits",
  "language": "de",
  "category": "food",
  "title": "Fruits",
  "description": "Common fruits in German",
  "emoji": "🍎",
  "imageSearch": true,
  "imageSource": "wikipedia",
  "items": [
    {
      "id": "apple",
      "word": "der Apfel",
      "article": "der",
      "translation": "apple",
      "unsplashQuery": "apple fruit",
      "example": "Ich esse einen Apfel.",
      "exampleTranslation": "I am eating an apple."
    }
  ]
}`;

export default function AdminPromptPage() {
  const { adminKey } = useAdminKey();
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [parsed, setParsed] = useState<Lesson | null>(null);
  const [parseError, setParseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleParse = () => {
    setParseError("");
    setParsed(null);
    try {
      const obj = JSON.parse(jsonText.trim()) as Lesson;
      if (!obj.language || !obj.title || !obj.items?.length) {
        throw new Error("Missing required fields: language, title, items");
      }
      setParsed(obj);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const handleSubmit = async () => {
    if (!parsed) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lesson");
      router.push(`/admin/lessons/${data.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error");
      setSubmitting(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">AI Prompt</h1>
      <p className="text-sm text-gray-500 mb-8">
        Copy the prompt template, paste it into ChatGPT or Claude with your
        topic, then paste the JSON output here.
      </p>

      {/* Step 1: Prompt template */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">
            Step 1 — Copy the prompt template
          </h2>
          <button
            onClick={copyPrompt}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
              copied
                ? "bg-emerald-100 text-emerald-700"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
            )}
          >
            {copied ? "✅ Copied!" : "📋 Copy prompt"}
          </button>
        </div>
        <pre className="text-xs text-gray-500 bg-gray-50 rounded-xl p-4 overflow-auto whitespace-pre-wrap max-h-60">
          {PROMPT_TEMPLATE}
        </pre>
      </div>

      {/* Step 2: Paste JSON */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-3">
          Step 2 — Paste the AI-generated JSON
        </h2>
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setParsed(null);
            setParseError("");
          }}
          rows={12}
          placeholder="Paste the JSON from ChatGPT / Claude here…"
          className="w-full font-mono text-xs px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 resize-y"
        />
        {parseError && (
          <p className="text-sm text-red-500 mt-2">⚠️ {parseError}</p>
        )}
        <div className="mt-3 flex gap-3">
          <button
            onClick={handleParse}
            disabled={!jsonText.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40"
          >
            Parse & preview
          </button>
          {jsonText && (
            <button
              onClick={() => {
                setJsonText("");
                setParsed(null);
                setParseError("");
              }}
              className="px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Step 3: Preview + submit */}
      {parsed && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4">
            Step 3 — Preview &amp; import
          </h2>

          {/* Lesson header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
              {parsed.emoji}
            </div>
            <div>
              <p className="font-bold text-gray-900">{parsed.title}</p>
              <p className="text-sm text-gray-500">{parsed.description}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                  {parsed.language}
                </span>
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                  {parsed.category}
                </span>
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                  {parsed.items.length} words
                </span>
                {parsed.imageSearch && (
                  <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-0.5">
                    🖼️ images ({parsed.imageSource ?? "wikipedia"})
                  </span>
                )}
                <span className="text-xs font-mono text-gray-400">
                  id: {parsed.id ?? "auto"}
                </span>
              </div>
            </div>
          </div>

          {/* Items preview */}
          <div className="bg-gray-50 rounded-xl overflow-hidden mb-4">
            <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
              <div>Word</div>
              <div>Translation</div>
              <div>Example</div>
            </div>
            {parsed.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-gray-50 last:border-0"
              >
                <div className="font-medium text-gray-900">
                  {item.article ? `${item.article} ` : ""}
                  {item.word}
                </div>
                <div className="text-gray-600">{item.translation}</div>
                <div className="text-xs text-gray-400 truncate">
                  {item.example ?? "—"}
                </div>
              </div>
            ))}
          </div>

          {submitError && (
            <p className="text-sm text-red-500 mb-3">⚠️ {submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Importing…" : "✅ Import lesson to Firestore"}
          </button>
        </div>
      )}
    </div>
  );
}
