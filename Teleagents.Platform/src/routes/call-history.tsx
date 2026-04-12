import { useDeferredValue, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { CallHistoryTable } from "@/components/call-history/call-history-table"
import { Input } from "@/components/ui/input"
import { callLogsService } from "@/lib/services/call-logs.service"

export const Route = createFileRoute("/call-history")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      callLogsService.listQueryOptions({ pageSize: 50 })
    ),
  component: CallHistoryPage,
})

function CallHistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())

  const callsQuery = useQuery({
    ...callLogsService.listQueryOptions({ pageSize: 50 }),
    placeholderData: keepPreviousData,
  })

  const items = useMemo(
    () => callsQuery.data?.items ?? [],
    [callsQuery.data?.items]
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
        isLoading={callsQuery.isLoading}
        search={deferredSearch}
        onRowClick={(call) => {
          void navigate({
            to: "/call-history/$conversationId",
            params: { conversationId: call.conversationId },
          })
        }}
      />
    </div>
  )
}
