import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[6px] px-2.5 py-0.5 text-[12px] font-semibold transition-colors",
        {
          "bg-[#f3e8ff] text-[#7c3aed]": variant === "default",
          "bg-[#f1f5f9] text-[#475569]": variant === "secondary",
          "text-[#64748b] border border-[#e2e8f0]": variant === "outline",
          "bg-red-50 text-red-600": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
