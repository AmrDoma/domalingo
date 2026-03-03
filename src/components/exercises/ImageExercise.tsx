"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Exercise, SRSQuality } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ImageExerciseProps {
  exercise: Exercise;
  onAnswer: (quality: SRSQuality) => void;
}

export function ImageExercise({ exercise, onAnswer }: ImageExerciseProps) {
  const { item, distractors = [] } = exercise;
  const [imageUrl, setImageUrl] = useState<string | null>(
    item.imageUrl ?? null,
  );
  const [imgLoading, setImgLoading] = useState(!item.imageUrl);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Use unsplashQuery if set, otherwise fall back to the English translation
  // (works great for Wikipedia which has an article for every concrete noun)
  useEffect(() => {
    if (imageUrl) {
      setImgLoading(false);
      return;
    }
    const query = item.unsplashQuery ?? item.translation;
    if (!query) {
      setImgLoading(false);
      return;
    }

    fetch(`/api/image-proxy?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.url) setImageUrl(d.url);
      })
      .catch(() => null)
      .finally(() => setImgLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [options] = useState(() => {
    const all = [
      { id: item.id, word: item.word, correct: true },
      ...distractors.map((d) => ({ id: d.id, word: d.word, correct: false })),
    ];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  });

  const handleSelect = (id: string) => {
    if (revealed) return;
    setSelected(id);
    setRevealed(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Prompt */}
      <p className="text-sm font-medium text-indigo-500 uppercase tracking-wider text-center">
        What is this?
      </p>

      {/* Image */}
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-sm">
        {imgLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin size-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.translation}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 100vw, 480px"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-7xl select-none">
            {exercise.lesson.emoji}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.correct;

          let state: "default" | "correct" | "wrong" = "default";
          if (revealed) {
            if (isCorrect) state = "correct";
            else if (isSelected) state = "wrong";
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={revealed}
              className={cn(
                "px-3 py-3 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 text-center leading-tight",
                state === "default" &&
                  "border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 active:scale-95",
                state === "correct" &&
                  "border-emerald-400 bg-emerald-50 text-emerald-800",
                state === "wrong" && "border-red-400 bg-red-50 text-red-800",
                revealed && state === "default" && "opacity-50",
              )}
            >
              {opt.word}
            </button>
          );
        })}
      </div>

      {/* Explanation after reveal */}
      {revealed && (
        <div className="text-center text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{item.word}</span>
          {" = "}
          <span>{item.translation}</span>
        </div>
      )}

      {/* Continue */}
      {revealed && (
        <Button
          fullWidth
          size="lg"
          onClick={() => onAnswer(selected === item.id ? 3 : 0)}
        >
          Continue
        </Button>
      )}
    </div>
  );
}
