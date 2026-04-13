import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { AgentsTable } from "@/components/agents/agents-table"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { agentsService } from "@/lib/services/agents.service"

const PAGE_SIZE = 10

export const Route = createFileRoute("/agents")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      agentsService.listQueryOptions({ pageSize: PAGE_SIZE })
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

  const agentsQuery = useInfiniteQuery({
    queryKey: agentsService.queryKeys.list(queryInput),
    queryFn: ({ pageParam }) =>
      agentsService.list({
        ...queryInput,
        ...(typeof pageParam === "string" && pageParam
          ? { cursor: pageParam }
          : {}),
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  })

  const agents = useMemo(
    () => agentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agentsQuery.data?.pages]
  )

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingNextRef = useRef(false)

  useEffect(() => {
    fetchingNextRef.current = false
  }, [deferredSearch])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (!agentsQuery.hasNextPage) return
        if (agentsQuery.isFetchingNextPage) return
        if (fetchingNextRef.current) return

        fetchingNextRef.current = true
        void agentsQuery.fetchNextPage().finally(() => {
          fetchingNextRef.current = false
        })
      },
      { rootMargin: "200px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [
    agentsQuery.hasNextPage,
    agentsQuery.isFetchingNextPage,
    agentsQuery.fetchNextPage,
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

      <div ref={sentinelRef} className="flex h-10 items-center justify-center">
        {agentsQuery.isFetchingNextPage ? (
          <Spinner className="size-4 text-muted-foreground" />
        ) : null}
      </div>
    </div>
  )
}
