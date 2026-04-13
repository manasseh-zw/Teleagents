import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { AgentsTable } from "@/components/agents/agents-table"
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll-trigger"
import { Input } from "@/components/ui/input"
import { agentsService } from "@/lib/services/agents.service"
import { createLogger } from "@/lib/utils/logger"

const PAGE_SIZE = 15
const DEBUG_AGENTS_INFINITE_SCROLL = import.meta.env.DEV
const logger = createLogger("agents-infinite")

export const Route = createFileRoute("/agents")({
  loader: ({ context }) =>
    context.queryClient.ensureInfiniteQueryData(
      agentsService.listInfiniteQueryOptions({ pageSize: PAGE_SIZE })
    ),
  component: AgentsPage,
})

function AgentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())
  const queryInput = useMemo(
    () =>
      deferredSearch
        ? { search: deferredSearch, pageSize: PAGE_SIZE }
        : { pageSize: PAGE_SIZE },
    [deferredSearch]
  )

  const agentsQuery = useInfiniteQuery(agentsService.listInfiniteQueryOptions(queryInput))

  const agents = useMemo(
    () => agentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agentsQuery.data?.pages]
  )

  useEffect(() => {
    if (!DEBUG_AGENTS_INFINITE_SCROLL) {
      return
    }

    logger.info("query:state", {
      pages: agentsQuery.data?.pages.length ?? 0,
      items: agents.length,
      hasNextPage: agentsQuery.hasNextPage,
      isFetching: agentsQuery.isFetching,
      isFetchingNextPage: agentsQuery.isFetchingNextPage,
      search: deferredSearch,
    })
  }, [
    agents.length,
    agentsQuery.data?.pages.length,
    agentsQuery.hasNextPage,
    agentsQuery.isFetching,
    agentsQuery.isFetchingNextPage,
    deferredSearch,
  ])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-2 md:px-8 md:pt-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Agents
      </h1>

      <div className="relative w-full">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search agents..."
          aria-label="Search agents"
          className="h-9 pl-9 text-sm shadow-none"
        />
      </div>

      <AgentsTable
        agents={agents}
        isError={agentsQuery.isError}
        isLoading={agentsQuery.isLoading && agents.length === 0}
        search={deferredSearch}
        onRowClick={(agent) => {
          void navigate({
            to: "/agents/$agentId",
            params: { agentId: agent.id },
          })
        }}
      />

      <InfiniteScrollTrigger
        canLoadMore={Boolean(agentsQuery.hasNextPage)}
        isLoading={agentsQuery.isFetchingNextPage}
        onLoadMore={() => agentsQuery.fetchNextPage()}
      />
    </div>
  )
}
