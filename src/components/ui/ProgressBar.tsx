import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  color?: "indigo" | "emerald" | "amber";
  size?: "sm" | "md";
  animated?: boolean;
}

export function ProgressBar({
  value,
  className,
  color = "indigo",
  size = "md",
  animated = false,
}: ProgressBarProps) {
  const colors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-400",
  };
  const heights = { sm: "h-1.5", md: "h-2.5" };

  return (
    <div
      className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        heights[size],
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          colors[color],
          animated && "animate-pulse",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
