import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none w-max",
        {
          "border-transparent bg-blue-100 text-blue-700": variant === "default",
          "border-transparent bg-gray-100 text-gray-600": variant === "secondary",
          "border-transparent bg-red-100 text-red-700 font-medium": variant === "destructive",
          "border-transparent bg-emerald-100 text-emerald-700 font-medium": variant === "success",
          "border-transparent bg-amber-100 text-amber-700 font-medium": variant === "warning",
          "border-gray-300 text-gray-600": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
