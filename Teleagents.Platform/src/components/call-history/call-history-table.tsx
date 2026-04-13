import { useMemo, useState } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  Search,
  WifiOff,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton, SkeletonText } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  interactiveTableRowClassName,
  tableBodyCellClassName,
} from "@/lib/table-interactive-row"
import type { CallLogSummary } from "@/lib/types/call-logs"
import { cn } from "@/lib/utils"

interface CallHistoryTableProps {
  calls: CallLogSummary[]
  error?: unknown
  isError?: boolean
  isLoading?: boolean
  search: string
  onRowClick?: (call: CallLogSummary) => void
}

const columnHelper = createColumnHelper<CallLogSummary>()

const loadingCalls: Array<{
  agent: string
  duration: string
  summary: string
  date: string
  statusWidth: string
}> = [
  {
    agent: "Customer Support Assistant",
    duration: "8:34",
    summary: "Caller asked about a missed payment and requested a callback.",
    date: "Apr 12, 2026, 9:24 AM",
    statusWidth: "w-24",
  },
  {
    agent: "Collections Follow-Up Agent",
    duration: "12:09",
    summary: "Conversation covered verification steps and repayment options.",
    date: "Apr 11, 2026, 2:18 PM",
    statusWidth: "w-20",
  },
  {
    agent: "Outbound Sales Concierge",
    duration: "3:51",
    summary: "Lead qualification call with product questions and next steps.",
    date: "Apr 10, 2026, 11:07 AM",
    statusWidth: "w-24",
  },
  {
    agent: "Support Escalation Desk",
    duration: "16:22",
    summary: "Urgent issue triaged and passed to a live human operator.",
    date: "Apr 9, 2026, 4:42 PM",
    statusWidth: "w-[5.5rem]",
  },
  {
    agent: "Renewals Assistant",
    duration: "5:47",
    summary: "Renewal preferences captured and confirmation sent to caller.",
    date: "Apr 8, 2026, 8:03 AM",
    statusWidth: "w-24",
  },
  {
    agent: "Front Desk Triage Agent",
    duration: "7:15",
    summary: "General inquiry routed to the appropriate internal team.",
    date: "Apr 7, 2026, 6:15 PM",
    statusWidth: "w-20",
  },
]

function formatDate(value: string | null) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "—"
  }
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m}:${s.toString().padStart(2, "0")}`
}

function getSortIcon(direction: false | "asc" | "desc") {
  if (direction === "asc") {
    return ArrowUpIcon
  }
  if (direction === "desc") {
    return ArrowDownIcon
  }
  return ArrowUpDownIcon
}

function statusBadge(log: CallLogSummary) {
  if (log.status === "Failed" || log.isSuccessful === false) {
    return {
      label: "Failed",
      className:
        "border-destructive/25 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/15",
    }
  }
  if (log.isSuccessful === true || log.status === "Done") {
    return {
      label: "Successful",
      className:
        "border-chart-1/30 bg-chart-1/20 text-chart-4 dark:border-chart-1/25 dark:bg-chart-1/12 dark:text-chart-1",
    }
  }
  if (log.status === "InProgress" || log.status === "Initiated") {
    return {
      label: log.status === "Initiated" ? "Initiated" : "In progress",
      className: "border-border bg-muted text-muted-foreground",
    }
  }
  if (log.status === "Processing") {
    return {
      label: "Processing",
      className: "border-border bg-muted text-muted-foreground",
    }
  }
  return {
    label: "Unknown",
    className: "border-border bg-muted text-muted-foreground",
  }
}

function CallHistoryLoadingRow({
  index,
  columnCount,
}: {
  index: number
  columnCount: number
}) {
  const row = loadingCalls[index % loadingCalls.length]

  return (
    <TableRow aria-hidden className="border-b-0 hover:bg-transparent">
      <TableCell className={tableBodyCellClassName(0, columnCount)}>
        <SkeletonText className="block max-w-56 truncate text-sm sm:max-w-xs">
          {row.agent}
        </SkeletonText>
      </TableCell>
      <TableCell className={tableBodyCellClassName(1, columnCount)}>
        <SkeletonText className="text-sm tabular-nums">
          {row.duration}
        </SkeletonText>
      </TableCell>
      <TableCell className={tableBodyCellClassName(2, columnCount)}>
        <SkeletonText className="block max-w-[min(28rem,40vw)] truncate text-sm">
          {row.summary}
        </SkeletonText>
      </TableCell>
      <TableCell className={tableBodyCellClassName(3, columnCount)}>
        <div className="flex justify-end">
          <Skeleton className={cn("h-6 rounded-full", row.statusWidth)} />
        </div>
      </TableCell>
      <TableCell
        className={tableBodyCellClassName(4, columnCount, {
          alignLastRight: true,
        })}
      >
        <span className="inline-flex justify-end">
          <SkeletonText className="text-sm tabular-nums">
            {row.date}
          </SkeletonText>
        </span>
      </TableCell>
    </TableRow>
  )
}

export function CallHistoryTable({
  calls,
  error,
  isError = false,
  isLoading = false,
  search,
  onRowClick,
}: CallHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "startTimeUtc", desc: true },
  ])

  const filteredCalls = useMemo(() => {
    if (!search.trim()) {
      return calls
    }
    const q = search.trim().toLowerCase()
    return calls.filter((log) => {
      const blob = [
        log.agentDisplayName,
        log.summaryTitle,
        log.transcriptSummary,
        log.conversationId,
        log.mainLanguage,
        log.terminationReason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return blob.includes(q)
    })
  }, [calls, search])

  const columns = useMemo(
    () => [
      columnHelper.accessor("agentDisplayName", {
        header: () => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Agent
          </span>
        ),
        cell: ({ getValue }) => (
          <span className="block max-w-56 truncate text-sm text-foreground sm:max-w-xs">
            {getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("durationSeconds", {
        header: () => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Duration
          </span>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground tabular-nums">
            {formatDuration(getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "summary",
        header: () => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Summary
          </span>
        ),
        cell: ({ row }) => {
          const text =
            row.original.transcriptSummary?.trim() ||
            row.original.summaryTitle?.trim() ||
            ""
          return (
            <span
              className="block max-w-[min(28rem,40vw)] truncate text-sm text-muted-foreground"
              title={text || undefined}
            >
              {text || "—"}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "callStatus",
        header: () => (
          <div className="flex w-full justify-end">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Call status
            </span>
          </div>
        ),
        cell: ({ row }) => {
          const { label, className } = statusBadge(row.original)
          return (
            <div className="flex justify-end">
              <Badge variant="outline" className={cn("font-medium", className)}>
                {label}
              </Badge>
            </div>
          )
        },
      }),
      columnHelper.accessor("startTimeUtc", {
        header: ({ column }) => {
          const SortIcon = getSortIcon(column.getIsSorted())
          return (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto flex h-auto items-center justify-end gap-1 px-2 py-0 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-transparent hover:text-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date
              <SortIcon className="size-3" />
            </Button>
          )
        },
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground tabular-nums">
            {formatDate(getValue())}
          </span>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<string | null>(columnId)
          const b = rowB.getValue<string | null>(columnId)
          const ta = a ? new Date(a).getTime() : 0
          const tb = b ? new Date(b).getTime() : 0
          return ta === tb ? 0 : ta < tb ? -1 : 1
        },
      }),
    ],
    []
  )

  const table = useReactTable({
    data: filteredCalls,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const columnCount = columns.length
  const hasNoResults =
    !isLoading && !isError && table.getRowModel().rows.length === 0

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-border hover:bg-transparent"
            >
              {headerGroup.headers.map((header, index) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "h-10 px-2.5 py-2",
                    index === 0 ? "pl-2.5" : undefined,
                    index === headerGroup.headers.length - 1
                      ? "pr-2.5 text-right"
                      : undefined
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          <TableRow
            aria-hidden
            className="pointer-events-none border-0 hover:bg-transparent"
          >
            <TableCell
              colSpan={columnCount}
              className="h-4 border-0 bg-transparent p-0 hover:bg-transparent"
            />
          </TableRow>
          {isLoading ? (
            Array.from({ length: 6 }, (_, index) => (
              <CallHistoryLoadingRow
                key={`loading-${index}`}
                index={index}
                columnCount={columnCount}
              />
            ))
          ) : isError ? (
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableCell colSpan={columnCount} className="px-2.5 py-6">
                <EmptyState
                  compact
                  icon={<WifiOff className="size-8" />}
                  title="Network error"
                  description={
                    error instanceof Error &&
                    error.message.trim() &&
                    !/fetch failed/i.test(error.message)
                      ? error.message
                      : "We couldn't reach the server to load conversation history."
                  }
                  action={
                    <Button variant="outline" render={<Link to="/support" />}>
                      Contact support
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ) : hasNoResults ? (
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableCell colSpan={columnCount} className="px-2.5 py-6">
                <EmptyState
                  compact
                  icon={<Search className="size-8" />}
                  title={search.trim() ? "No results" : "No conversations yet"}
                  description={
                    search.trim()
                      ? "No conversations were found for the current search."
                      : "Conversation history will appear here once calls are available."
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                tabIndex={0}
                className={interactiveTableRowClassName}
                aria-label={`Open conversation ${row.original.summaryTitle || row.original.conversationId}`}
                onClick={() => onRowClick?.(row.original)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onRowClick?.(row.original)
                  }
                }}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={tableBodyCellClassName(
                      index,
                      row.getVisibleCells().length,
                      { interactive: true, alignLastRight: true }
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
