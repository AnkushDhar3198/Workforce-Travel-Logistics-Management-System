import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-cyan-600/10 text-cyan-400 border-cyan-500/20": variant === "default",
          "border-transparent bg-slate-800 text-slate-100": variant === "secondary",
          "bg-red-500/10 text-red-400 border-red-500/20": variant === "destructive",
          "border-slate-800 bg-transparent text-slate-350": variant === "outline",
          "bg-green-500/10 text-green-400 border-green-500/20": variant === "success",
          "bg-yellow-500/10 text-yellow-400 border-yellow-500/20": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
