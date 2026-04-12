"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type OrganizationUsageIndicatorProps = {
  used: number
  cap: number
  /** Shown in tooltip, e.g. "Credits" */
  label?: string
  className?: string
}

export function OrganizationUsageIndicator({
  used,
  cap,
  label = "Usage",
  className,
}: OrganizationUsageIndicatorProps) {
  const safeCap = cap > 0 ? cap : 1
  const pct = Math.min(100, Math.max(0, Math.round((used / safeCap) * 100)))
  const r = 15
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "relative inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground ring-sidebar-ring outline-none focus-visible:ring-2",
          className
        )}
        aria-label={`${label}: ${pct}% of limit`}
      >
        <svg className="size-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            className="stroke-muted-foreground/25"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-out"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">
          {pct}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-xs">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs">
          {used.toLocaleString()} of {cap.toLocaleString()} ({pct}%)
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
