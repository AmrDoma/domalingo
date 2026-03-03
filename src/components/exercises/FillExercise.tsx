"use client";

import { useState, useRef, useEffect } from "react";
import { Exercise, SRSQuality } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FillExerciseProps {
  exercise: Exercise;
  onAnswer: (quality: SRSQuality) => void;
}

/** Trim and collapse internal whitespace */
function clean(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

const ARTICLE_RE = /^(der|die|das|ein|eine)\s+/i;

/** Split "der Laptop" → { article: "der", noun: "Laptop" }.
 *  If no article prefix, article is "". */
function splitArticle(s: string): { article: string; noun: string } {
  const cleaned = clean(s);
  const match = cleaned.match(ARTICLE_RE);
  if (match) {
    return {
      article: match[1].toLowerCase(),
      noun: cleaned.slice(match[0].length),
    };
  }
  return { article: "", noun: cleaned };
}

export function FillExercise({ exercise, onAnswer }: FillExerciseProps) {
  const { item } = exercise;
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [quality, setQuality] = useState<SRSQuality | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const check = () => {
    if (revealed || !input.trim()) return;

    const user = splitArticle(input);
    const correct = splitArticle(item.word);

    // Noun must match exactly (case-sensitive: "Laptop" ≠ "laptop")
    const nounCorrect = user.noun === correct.noun;
    // Article is forgiven for capitalisation (Der == der) but must be the right word
    const articleCorrect =
      correct.article === "" || user.article === correct.article; // both already lowercased

    let q: SRSQuality;
    if (nounCorrect && articleCorrect)
      q = 3; // exact
    else if (nounCorrect && !articleCorrect)
      q = 2; // good – noun right, article wrong/missing
    else q = 0; // noun wrong → again

    setQuality(q);
    setRevealed(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!revealed) check();
      else if (quality !== null && !submitting) {
        setSubmitting(true);
        onAnswer(quality);
      }
    }
  };

  const resultColor = (): string => {
    if (!revealed || quality === null) return "border-gray-300";
    if (quality === 3) return "border-emerald-400 bg-emerald-50";
    if (quality === 2) return "border-amber-400 bg-amber-50";
    return "border-red-400 bg-red-50";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt */}
      <div className="text-center px-2">
        <p className="text-sm font-medium text-indigo-500 uppercase tracking-wider mb-2">
          Type in German
        </p>
        <h2 className="text-4xl font-bold text-gray-900">{item.translation}</h2>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => !revealed && setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type the German word…"
          disabled={revealed}
          className={cn(
            "w-full px-5 py-4 text-xl font-medium rounded-2xl border-2 outline-none transition-all duration-200",
            "placeholder:text-gray-300",
            resultColor(),
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Feedback */}
      {revealed && quality !== null && (
        <div
          className={cn(
            "rounded-2xl px-5 py-4",
            quality === 3
              ? "bg-emerald-50 border border-emerald-200"
              : quality === 2
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200",
          )}
        >
          <p
            className={cn(
              "font-semibold text-base",
              quality === 3
                ? "text-emerald-700"
                : quality === 2
                  ? "text-amber-700"
                  : "text-red-700",
            )}
          >
            {quality === 3
              ? "Perfect! 🎉"
              : quality === 2
                ? "Almost — don't forget the article! 👌"
                : "Not quite — the correct answer is:"}
          </p>
          {quality < 3 && (
            <p className="text-2xl font-bold text-gray-800 mt-1">{item.word}</p>
          )}
          {item.example && (
            <p className="text-sm text-gray-500 italic mt-2">
              "{item.example}"
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {!revealed ? (
        <Button fullWidth size="lg" onClick={check} disabled={!input.trim()}>
          Check
        </Button>
      ) : (
        <Button
          fullWidth
          size="lg"
          disabled={submitting}
          onClick={() => {
            if (quality !== null && !submitting) {
              setSubmitting(true);
              onAnswer(quality);
            }
          }}
        >
          Continue
        </Button>
      )}
    </div>
  );
}
