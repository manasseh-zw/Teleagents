import { useDeferredValue, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { AgentsTable } from "@/components/agents/agents-table"
import { Input } from "@/components/ui/input"
import { agentsService } from "@/lib/services/agents.service"

export const Route = createFileRoute("/agents")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(agentsService.listQueryOptions()),
  component: AgentsPage,
})

function AgentsPage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())
  const queryInput = useMemo(
    () => (deferredSearch ? { search: deferredSearch } : {}),
    [deferredSearch]
  )

  const agentsQuery = useQuery({
    ...agentsService.listQueryOptions(queryInput),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-2 md:px-8 md:pt-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Agents
      </h1>

      <div className="relative w-full max-w-md">
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
        agents={agentsQuery.data ?? []}
        isError={agentsQuery.isError}
        isLoading={agentsQuery.isLoading}
        search={deferredSearch}
      />
    </div>
  )
}
