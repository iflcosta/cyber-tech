import * as React from "react";
import { cn } from "./Button";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[2px] border border-[#D4D2CF] bg-white px-4 py-2 text-sm text-[#1A1A1A] placeholder:text-[#AAAAAA] focus:outline-nãone focus:border-[#1A1A1A] disabled:cursor-nãot-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
