"use client";

import { useState } from "react";
import { Exercise, SRSQuality } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface MCQExerciseProps {
  exercise: Exercise;
  onAnswer: (quality: SRSQuality) => void;
}

export function MCQExercise({ exercise, onAnswer }: MCQExerciseProps) {
  const { item, distractors = [] } = exercise;
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Build 4 options: correct + 3 distractors, shuffled once on mount
  const [options] = useState(() => {
    const all = [
      { id: item.id,           text: item.translation,  correct: true  },
      ...distractors.map((d) => ({ id: d.id, text: d.translation, correct: false })),
    ];
    // Fisher-Yates in place
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  });

  const handleSelect = (optionId: string) => {
    if (revealed) return;
    setSelected(optionId);
    setRevealed(true);
  };

  const handleContinue = () => {
    if (submitting) return;
    setSubmitting(true);
    const isCorrect = selected === item.id;
    onAnswer(isCorrect ? 3 : 0);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt */}
      <div className="text-center px-2">
        <p className="text-sm font-medium text-indigo-500 uppercase tracking-wider mb-2">
          What does this mean?
        </p>
        <h2 className="text-4xl font-bold text-gray-900 leading-tight">
          {item.word}
        </h2>
        {item.article && (
          <span className="text-lg text-gray-400 mt-1 block">{item.article}</span>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect  = opt.correct;

          let state: "default" | "correct" | "wrong" | "missed" = "default";
          if (revealed) {
            if (isCorrect)              state = "correct";
            else if (isSelected)        state = "wrong";
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={revealed}
              className={cn(
                "w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-base transition-all duration-200",
                state === "default" &&
                  "border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98]",
                state === "correct" &&
                  "border-emerald-400 bg-emerald-50 text-emerald-800",
                state === "wrong" &&
                  "border-red-400 bg-red-50 text-red-800",
                revealed && state === "default" && "opacity-50"
              )}
            >
              <span className="flex items-center gap-3">
                {revealed && state === "correct" && <span>✅</span>}
                {revealed && state === "wrong"   && <span>❌</span>}
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Example sentence (after reveal) */}
      {revealed && item.example && (
        <div className="bg-indigo-50 rounded-2xl px-4 py-3 text-sm">
          <p className="font-medium text-indigo-700 italic">"{item.example}"</p>
          {item.exampleTranslation && (
            <p className="text-indigo-500 mt-0.5">— {item.exampleTranslation}</p>
          )}
        </div>
      )}

      {/* Continue */}
      {revealed && (
        <Button fullWidth size="lg" onClick={handleContinue} disabled={submitting}>
          Continue
        </Button>
      )}
    </div>
  );
}
