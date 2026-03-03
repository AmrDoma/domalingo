import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: boolean;
}

export function Card({
  className,
  children,
  padding = "md",
  shadow = true,
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-3xl",
        paddings[padding],
        shadow && "shadow-sm border border-gray-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
