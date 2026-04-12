import { useMemo, useState } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  isError?: boolean
  isLoading?: boolean
  search: string
  onRowClick?: (call: CallLogSummary) => void
}

const columnHelper = createColumnHelper<CallLogSummary>()

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

export function CallHistoryTable({
  calls,
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
      columnHelper.accessor("startTimeUtc", {
        header: ({ column }) => {
          const SortIcon = getSortIcon(column.getIsSorted())
          return (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 h-auto px-2 py-0 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-transparent hover:text-foreground"
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
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Call status
          </span>
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
                    "h-10 px-3 py-2",
                    index === 0 ? "pl-0" : undefined,
                    index === headerGroup.headers.length - 1 ? "pr-0" : undefined
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
              <TableRow
                key={`loading-${index}`}
                className="border-b-0 hover:bg-transparent"
              >
                <TableCell colSpan={columnCount} className="px-0 py-0">
                  <div className="grid grid-cols-5 gap-4 px-2 py-3 md:px-3">
                    {Array.from({ length: columnCount }, (_, cellIndex) => (
                      <div
                        key={cellIndex}
                        className={cn(
                          "h-3.5 rounded-full bg-muted/80",
                          cellIndex === 0
                            ? "w-36"
                            : cellIndex === 1
                              ? "w-28"
                              : "w-20"
                        )}
                      />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="px-2 py-8 text-left text-sm text-muted-foreground md:px-3"
              >
                We couldn&apos;t load call history right now. Please try again.
              </TableCell>
            </TableRow>
          ) : hasNoResults ? (
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="px-2 py-8 text-left text-sm text-muted-foreground md:px-3"
              >
                {search.trim()
                  ? `No calls found for "${search.trim()}".`
                  : "No calls yet."}
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
