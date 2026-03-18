import * as React from "react";
import { Badge } from "./ui/Badge";
import { cn } from "./ui/Button";

interface PerformanceBadgeProps {
  score: number;
  className?: string;
}

export function PerformanceBadge({ score, className }: PerformanceBadgeProps) {
  const getLevel = (s: number) => {
    if (s >= 90) return { label: "ULTRA", color: "bg-[#1A1A1A] text-white" };
    if (s >= 70) return { label: "HIGH", color: "bg-[#555555] text-white" };
    if (s >= 40) return { label: "MID", color: "bg-[#888888] text-white" };
    return { label: "ENTRY", color: "bg-[#CCCCCC] text-[#1A1A1A]" };
  };

  const level = getLevel(score);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("px-2 py-0.5 text-[8px] font-display font-bold tracking-[0.2em] rounded-[2px]", level.color)}>
        {level.label}
      </div>
      <span className="text-[10px] font-display font-bold tracking-tight text-[#1A1A1A]">
        {score} PTS
      </span>
    </div>
  );
}
