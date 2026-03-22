import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "none";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, asChild, children, disabled, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          "inline-flex items-center justify-center rounded-[2px] font-display font-bold uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-40 disabled:grayscale disabled:pointer-events-none duration-[130ms] ease-linear",
          "bg-[#1A1A1A] text-white hover:bg-[#333333]", // Default variant if nãot passed
          className,
          (children as React.ReactElement<any>).props.className
        ),
        ...props,
        ref,
      });
    }

    const variants = {
      primary: "bg-[#1A1A1A] text-white hover:bg-[#333333] border border-[#1A1A1A]",
      secondary: "bg-[#F8F7F5] text-[#1A1A1A] hover:bg-[#ECEAE6] border border-[#D4D2CF]",
      outline: "bg-transparent border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white",
      ghost: "bg-transparent border border-[#D4D2CF] text-[#666666] hover:border-[#888888] hover:text-[#1A1A1A]",
      danger: "bg-red-600 text-white hover:bg-red-700",
      none: "",
    };

    const sizes = {
      sm: "h-9 px-4 text-[10px]",
      md: "h-11 px-6 text-xs",
      lg: "h-14 px-8 text-sm",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-[2px] font-display font-bold uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-40 disabled:grayscale disabled:pointer-events-none duration-[130ms] ease-linear",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, cn };
