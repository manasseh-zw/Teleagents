import { useState, useMemo } from "react"
import {
  SearchIcon,
  SlidersHorizontalIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  MoreHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { recentCalls, type CallStatus, type CallType } from "@/data/dashboard"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const statusConfig: Record<CallStatus, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  },
  voicemail: {
    label: "Voicemail",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },
  "no-answer": {
    label: "No answer",
    className:
      "bg-muted text-muted-foreground border-border",
  },
}

const ITEMS_PER_PAGE = 8

export function RecentCallsTable() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CallStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<CallType | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    return recentCalls.filter((call) => {
      const matchesSearch =
        search === "" ||
        call.client.toLowerCase().includes(search.toLowerCase()) ||
        call.callId.toLowerCase().includes(search.toLowerCase()) ||
        call.agent.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || call.status === statusFilter
      const matchesType = typeFilter === "all" || call.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [search, statusFilter, typeFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const hasFilters = statusFilter !== "all" || typeFilter !== "all"

  const resetPage = () => setCurrentPage(1)

  return (
    <div className="bg-card text-card-foreground rounded-xl border">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-5 py-4 border-b">
        <h3 className="font-medium text-sm">Recent calls</h3>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search calls..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="pl-8 h-8 w-full sm:w-[180px] text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5")}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              <span>Filter</span>
              {hasFilters && (
                <span className="size-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center leading-none">
                  !
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {(["all", "completed", "failed", "voicemail", "no-answer"] as const).map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter === s}
                  onCheckedChange={() => { setStatusFilter(s); resetPage() }}
                >
                  {s === "all" ? "All statuses" : statusConfig[s].label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Type</DropdownMenuLabel>
              {(["all", "inbound", "outbound"] as const).map((t) => (
                <DropdownMenuCheckboxItem
                  key={t}
                  checked={typeFilter === t}
                  onCheckedChange={() => { setTypeFilter(t); resetPage() }}
                >
                  {t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              {hasFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { setStatusFilter("all"); setTypeFilter("all"); resetPage() }}
                  >
                    Clear filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-5 w-[120px] text-xs font-medium">Call ID</TableHead>
              <TableHead className="min-w-[160px] text-xs font-medium">Client</TableHead>
              <TableHead className="w-[100px] text-xs font-medium">Type</TableHead>
              <TableHead className="min-w-[140px] text-xs font-medium">Agent</TableHead>
              <TableHead className="w-[90px] text-xs font-medium">Duration</TableHead>
              <TableHead className="w-[120px] text-xs font-medium">Status</TableHead>
              <TableHead className="w-[140px] text-xs font-medium">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">No calls found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((call) => (
                <TableRow key={call.id} className="group">
                  <TableCell className="pl-5">
                    <span className="font-medium text-sm tabular-nums">{call.callId}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 shrink-0">
                        <AvatarImage src={call.clientAvatar} />
                        <AvatarFallback className="text-[10px]">
                          {call.client.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{call.client}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {call.type === "inbound" ? (
                        <PhoneIncomingIcon className="size-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <PhoneOutgoingIcon className="size-3.5 text-violet-500 shrink-0" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">{call.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{call.agent}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums">{call.duration}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium", statusConfig[call.status].className)}
                    >
                      {statusConfig[call.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">{call.date}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon-sm" }),
                            "opacity-0 group-hover:opacity-100 transition-opacity"
                          )}
                        >
                          <MoreHorizontalIcon className="size-3.5 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Play recording</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t">
        <span className="text-xs text-muted-foreground tabular-nums">
          {filtered.length === 0
            ? "No results"
            : `${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} calls`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon-sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          {totalPages > 5 && (
            <>
              <span className="px-1 text-muted-foreground text-xs">…</span>
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
