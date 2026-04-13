import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-[1.75rem] border border-border bg-background text-center",
        compact ? "px-6 py-10" : "px-8 py-16",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-5 flex size-16 items-center justify-center rounded-[1.35rem] border border-border bg-background text-foreground">
          {icon}
        </div>
      ) : null}

      <div className="max-w-xl space-y-2">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  )
}
