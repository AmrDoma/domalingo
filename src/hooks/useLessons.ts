"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

export interface LessonSummary {
  id: string;
  language: string;
  category: string;
  title: string;
  description: string;
  emoji: string;
  itemCount: number;
  imageSearch: boolean;
}

export function useLessons(language: string | undefined) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!language) return;
    setLoading(true);
    setError(null);

    api
      .getLessons(language)
      .then(setLessons)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [language]);

  return { lessons, loading, error };
}
