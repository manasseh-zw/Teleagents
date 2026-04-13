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
import type { AgentSummary } from "@/lib/types/agents"
import { cn } from "@/lib/utils"

interface AgentsTableProps {
  agents: AgentSummary[]
  error?: unknown
  isError?: boolean
  isLoading?: boolean
  search: string
  onRowClick?: (agent: AgentSummary) => void
}

const columnHelper = createColumnHelper<AgentSummary>()

const loadingAgents: Array<{
  name: string
  description: string
  phoneNumber: string
  lastCall: string
  statusWidth: string
}> = [
  {
    name: "Customer Support Assistant",
    description: "Handles billing questions and account updates",
    phoneNumber: "+263 77 124 5521",
    lastCall: "Apr 12, 2026, 9:24 AM",
    statusWidth: "w-16",
  },
  {
    name: "Collections Follow-Up Agent",
    description: "Schedules callbacks and verifies repayment plans",
    phoneNumber: "+263 77 842 1903",
    lastCall: "Apr 11, 2026, 2:18 PM",
    statusWidth: "w-20",
  },
  {
    name: "Outbound Sales Concierge",
    description: "Qualifies leads for new product onboarding",
    phoneNumber: "+263 71 409 8874",
    lastCall: "Apr 10, 2026, 11:07 AM",
    statusWidth: "w-[4.5rem]",
  },
  {
    name: "Support Escalation Desk",
    description: "Routes urgent service issues to human operators",
    phoneNumber: "+263 78 219 6642",
    lastCall: "Apr 9, 2026, 4:42 PM",
    statusWidth: "w-16",
  },
  {
    name: "Renewals Assistant",
    description: "Confirms subscription renewals and plan changes",
    phoneNumber: "+263 77 315 4428",
    lastCall: "Apr 8, 2026, 8:03 AM",
    statusWidth: "w-20",
  },
  {
    name: "Front Desk Triage Agent",
    description: "Captures caller intent and directs next actions",
    phoneNumber: "+263 73 991 2250",
    lastCall: "Apr 7, 2026, 6:15 PM",
    statusWidth: "w-[4.5rem]",
  },
]

function formatDate(value: string | null) {
  if (!value) {
    return "Never"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
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

function AgentsTableLoadingRow({
  index,
  columnCount,
}: {
  index: number
  columnCount: number
}) {
  const row = loadingAgents[index % loadingAgents.length]

  return (
    <TableRow
      aria-hidden
      className="border-b border-border last:border-b-0 hover:bg-transparent"
    >
      <TableCell className={tableBodyCellClassName(0, columnCount)}>
        <SkeletonText className="block max-w-48 truncate text-sm font-medium sm:max-w-56">
          {row.name}
        </SkeletonText>
      </TableCell>
      <TableCell className={tableBodyCellClassName(1, columnCount)}>
        <SkeletonText className="block max-w-[min(24rem,35vw)] truncate text-sm">
          {row.description}
        </SkeletonText>
      </TableCell>
      <TableCell className={tableBodyCellClassName(2, columnCount)}>
        <SkeletonText className="text-sm tabular-nums">
          {row.phoneNumber}
        </SkeletonText>
      </TableCell>
      <TableCell className={tableBodyCellClassName(3, columnCount)}>
        <Skeleton className={cn("h-6 rounded-full", row.statusWidth)} />
      </TableCell>
      <TableCell
        className={tableBodyCellClassName(4, columnCount, {
          alignLastRight: true,
        })}
      >
        <span className="inline-flex justify-end">
          <SkeletonText className="text-sm tabular-nums">
            {row.lastCall}
          </SkeletonText>
        </span>
      </TableCell>
    </TableRow>
  )
}

export function AgentsTable({
  agents,
  error,
  isError = false,
  isLoading = false,
  search,
  onRowClick,
}: AgentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "lastCallAtUtc",
      desc: true,
    },
  ])

  const columns = useMemo(
    () => [
      columnHelper.accessor("displayName", {
        header: () => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Name
          </span>
        ),
        cell: ({ getValue }) => (
          <span className="block max-w-48 truncate text-sm font-medium text-foreground sm:max-w-56">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("description", {
        header: () => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Description
          </span>
        ),
        cell: ({ getValue }) => {
          const text = getValue()?.trim()
          return (
            <span
              className="block max-w-[min(24rem,35vw)] truncate text-sm text-muted-foreground"
              title={text || undefined}
            >
              {text || "—"}
            </span>
          )
        },
      }),
      columnHelper.accessor("assignedPhoneNumber", {
        header: () => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Phone number
          </span>
        ),
        cell: ({ getValue }) => {
          const value = getValue()

          return (
            <span className="text-sm text-foreground tabular-nums">
              {value || "—"}
            </span>
          )
        },
      }),
      columnHelper.accessor("isActive", {
        header: () => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </span>
        ),
        cell: ({ getValue }) => {
          const active = getValue()
          return (
            <Badge variant={active ? "outline" : "secondary"}>
              {active ? "Active" : "Inactive"}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("lastCallAtUtc", {
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
              Last call
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
    data: agents,
    columns,
    state: {
      sorting,
    },
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
              <AgentsTableLoadingRow
                key={`loading-${index}`}
                index={index}
                columnCount={columnCount}
              />
            ))
          ) : isError ? (
            <TableRow className="border-b border-border hover:bg-transparent">
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
                      : "We couldn't reach the server to load agents right now."
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
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableCell colSpan={columnCount} className="px-2.5 py-6">
                <EmptyState
                  compact
                  icon={<Search className="size-8" />}
                  title={search ? "No results" : "No agents yet"}
                  description={
                    search
                      ? `No agents were found for "${search}".`
                      : "Agents will appear here once they become available."
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                tabIndex={onRowClick ? 0 : undefined}
                className={
                  onRowClick
                    ? interactiveTableRowClassName
                    : "border-b border-border last:border-b-0 hover:bg-transparent"
                }
                aria-label={
                  onRowClick
                    ? `Open agent ${row.original.displayName}`
                    : undefined
                }
                onClick={
                  onRowClick ? () => onRowClick(row.original) : undefined
                }
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onRowClick(row.original)
                        }
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={tableBodyCellClassName(
                      index,
                      row.getVisibleCells().length,
                      {
                        interactive: Boolean(onRowClick),
                        alignLastRight: true,
                      }
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
