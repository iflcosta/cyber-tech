import * as React from "react";
import { cn } from "./Button";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#1A1A1A] text-white border-[#1A1A1A]",
    secondary: "bg-[#F8F7F5] text-[#555555] border-[#D4D2CF]",
    outline: "bg-transparent text-[#1A1A1A] border-[#D4D2CF]",
    destructive: "bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/20",
    success: "bg-[#1A1A1A] text-white border-[#1A1A1A]", // Industrial success
    warning: "bg-[#F0EFED] text-[#1A1A1A] border-[#D4D2CF]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[2px] border px-2 font-display text-[8px] font-bold uppercase tracking-[0.15em] transition-colors leading-none py-1",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
