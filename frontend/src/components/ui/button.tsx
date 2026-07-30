import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
          {
            "bg-cyan-600 text-[#030712] shadow hover:bg-cyan-500": variant === "default",
            "bg-red-650/20 text-red-400 border border-red-500/30 hover:bg-red-600/35": variant === "destructive",
            "border border-slate-800 bg-transparent text-slate-300 shadow-sm hover:bg-slate-800 hover:text-slate-100": variant === "outline",
            "bg-slate-800 text-slate-100 shadow-sm hover:bg-slate-700": variant === "secondary",
            "hover:bg-slate-800 hover:text-slate-100 text-slate-400": variant === "ghost",
            "text-cyan-400 underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
