import * as React from "react";
import { Badge } from "./ui/Badge";
import { cn } from "./ui/Button";

interface PerformanceBadgeProps {
  score: number;
  className?: string;
  variant?: 'default' | 'mini';
}

export function PerformanceBadge({ score, className, variant = 'default' }: PerformanceBadgeProps) {
  const getLevel = (s: number) => {
    if (s >= 90) return { label: "ULTRA", color: "bg-[#1A1A1A] text-white" };
    if (s >= 70) return { label: "HIGH", color: "bg-[#555555] text-white" };
    if (s >= 40) return { label: "MID", color: "bg-[#888888] text-white" };
    return { label: "ENTRY", color: "bg-[#CCCCCC] text-[#1A1A1A]" };
  };

  const level = getLevel(score);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "font-display font-bold tracking-[0.2em] rounded-[2px] border border-white/5",
        variant === 'mini' ? "px-1.5 py-0 text-[7px]" : "px-2 py-0.5 text-[8px]",
        level.color
      )}>
        {level.label}
      </div>
      {variant !== 'mini' && (
        <span className="text-[10px] font-display font-bold tracking-tight text-[#1A1A1A]">
          {score} PTS
        </span>
      )}
    </div>
  );
}
