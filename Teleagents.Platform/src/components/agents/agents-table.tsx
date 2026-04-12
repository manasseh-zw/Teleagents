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
import type { AgentSummary } from "@/lib/types/agents"
import { cn } from "@/lib/utils"

interface AgentsTableProps {
  agents: AgentSummary[]
  isError?: boolean
  isLoading?: boolean
  search: string
  onRowClick?: (agent: AgentSummary) => void
}

const columnHelper = createColumnHelper<AgentSummary>()

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

export function AgentsTable({
  agents,
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
            <Badge variant={active ? "default" : "secondary"}>
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
              className="-ml-2 h-auto px-2 py-0 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-transparent hover:text-foreground"
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
                    "h-10 px-3 py-2",
                    index === 0 ? "pl-0" : undefined,
                    index === headerGroup.headers.length - 1
                      ? "pr-0"
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
              <TableRow
                key={`loading-${index}`}
                className="border-b border-border last:border-b-0 hover:bg-transparent"
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
                              ? "w-24"
                              : "w-20"
                        )}
                      />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="px-2 py-8 text-left text-sm text-muted-foreground md:px-3"
              >
                We couldn&apos;t load agents right now. Please try again.
              </TableCell>
            </TableRow>
          ) : hasNoResults ? (
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="px-2 py-8 text-left text-sm text-muted-foreground md:px-3"
              >
                {search
                  ? `No agents found for "${search}".`
                  : "No agents are available yet."}
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
                      { interactive: Boolean(onRowClick) }
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
