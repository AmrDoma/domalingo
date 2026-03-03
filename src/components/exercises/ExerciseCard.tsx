"use client";

import { Exercise, SRSQuality } from "@/types";
import { MCQExercise } from "./MCQExercise";
import { FillExercise } from "./FillExercise";

interface ExerciseCardProps {
  exercise: Exercise;
  onAnswer: (quality: SRSQuality) => void;
}

export function ExerciseCard({ exercise, onAnswer }: ExerciseCardProps) {
  switch (exercise.type) {
    case "mcq":
      return <MCQExercise exercise={exercise} onAnswer={onAnswer} />;
    case "fill":
      return <FillExercise exercise={exercise} onAnswer={onAnswer} />;
  }
}
