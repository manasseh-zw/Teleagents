import { useState, useMemo } from "react"
import { MoreHorizontalIcon, ArrowDownIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { mostCalledAgents } from "@/data/dashboard"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type SortBy = "calls_desc" | "calls_asc" | "name_asc" | "name_desc"

function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? "#374151" : "#ffffff"
}

export function MostCalledAgents() {
  const [sortBy, setSortBy] = useState<SortBy>("calls_desc")

  const sorted = useMemo(() => {
    return [...mostCalledAgents].sort((a, b) => {
      switch (sortBy) {
        case "calls_desc": return b.calls - a.calls
        case "calls_asc": return a.calls - b.calls
        case "name_asc": return a.name.localeCompare(b.name)
        case "name_desc": return b.name.localeCompare(a.name)
      }
    })
  }, [sortBy])

  const maxCalls = Math.max(...sorted.map((a) => a.calls), 1)

  return (
    <div className="bg-card text-card-foreground rounded-xl border h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-medium text-sm">Most called agents</h3>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Calls</span>
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
              <MoreHorizontalIcon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowDownIcon className="size-4" />
                  Sort by
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setSortBy("calls_desc")}>
                    Calls (high to low) {sortBy === "calls_desc" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("calls_asc")}>
                    Calls (low to high) {sortBy === "calls_asc" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name_asc")}>
                    Name (A to Z) {sortBy === "name_asc" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name_desc")}>
                    Name (Z to A) {sortBy === "name_desc" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("calls_desc")}>
                Reset to default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col justify-between gap-3">
        {sorted.map((agent) => {
          const pct = (agent.calls / maxCalls) * 100
          const textColor = getTextColor(agent.color)
          return (
            <div key={agent.name} className="flex items-center gap-3">
              <div className="flex-1 h-9 rounded-lg bg-muted overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center px-3 transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: agent.color,
                    minWidth: "48px",
                  }}
                >
                  <span
                    className="text-xs font-medium truncate leading-none"
                    style={{ color: textColor }}
                  >
                    {agent.name}
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold w-9 text-right shrink-0 tabular-nums">
                {agent.calls}
              </span>
            </div>
          )
        })}
      </div>

      <div className="border-t px-5 py-3 flex items-center justify-end">
        <a href="/agents" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Show all →
        </a>
      </div>
    </div>
  )
}
