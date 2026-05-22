import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-[#7c3aed] text-white hover:bg-[#6d28d9]": variant === "default",
            "bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0]": variant === "secondary",
            "border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc]": variant === "outline",
            "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]": variant === "ghost",
            "bg-red-50 text-red-600 hover:bg-red-100": variant === "destructive",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-11 rounded-lg px-8": size === "lg",
            "h-9 w-9": size === "icon",
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
