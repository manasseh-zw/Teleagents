import { cn } from "@/lib/utils"

export const interactiveTableRowClassName =
  "group cursor-pointer border-b-0 outline-none transition-colors [&>td]:border-b-0 [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl hover:[&>td]:bg-muted/60 focus-visible:[&>td]:bg-muted/60"

export function tableBodyCellClassName(
  index: number,
  columnCount: number,
  options?: { interactive?: boolean; alignLastRight?: boolean }
) {
  const last = index === columnCount - 1
  return cn(
    "px-2.5 align-middle",
    options?.interactive ? "py-3" : "py-2.5",
    index === 0 ? "pl-2.5" : undefined,
    last ? "pr-2.5" : undefined,
    last && options?.alignLastRight ? "text-right" : undefined
  )
}

