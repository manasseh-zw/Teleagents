import { useDeferredValue, useMemo, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { CallHistoryTable } from "@/components/call-history/call-history-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { callLogsService } from "@/lib/services/call-logs.service"

const PAGE_SIZE = 15

export const Route = createFileRoute("/call-history")({
  loader: ({ context }) =>
    context.queryClient.ensureInfiniteQueryData(
      callLogsService.listInfiniteQueryOptions({ pageSize: PAGE_SIZE })
    ),
  component: CallHistoryPage,
})

function CallHistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())

  const queryInput = useMemo(
    () => ({
      pageSize: PAGE_SIZE,
    }),
    []
  )

  const callsQuery = useInfiniteQuery(
    callLogsService.listInfiniteQueryOptions(queryInput)
  )

  const items = useMemo(
    () => callsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [callsQuery.data?.pages]
  )

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-2 md:px-8 md:pt-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Call history
      </h1>

      <div className="relative w-full">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search calls..."
          aria-label="Search calls"
          className="h-9 pl-9 text-sm shadow-none"
        />
      </div>

      <CallHistoryTable
        calls={items}
        isError={callsQuery.isError}
        isLoading={callsQuery.isLoading && items.length === 0}
        search={deferredSearch}
        onRowClick={(call) => {
          void navigate({
            to: "/call-history/$conversationId",
            params: { conversationId: call.conversationId },
          })
        }}
      />

      {callsQuery.isFetchingNextPage ? (
        <div className="flex min-h-10 items-center justify-center">
          <Spinner className="size-4 text-muted-foreground" />
        </div>
      ) : callsQuery.hasNextPage ? (
        <div className="flex min-h-10 items-center justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void callsQuery.fetchNextPage()
            }}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  )
}
