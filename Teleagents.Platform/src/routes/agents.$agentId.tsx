import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetailPage,
})

function AgentDetailPage() {
  const { agentId } = Route.useParams()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 pt-4 pb-2 md:px-8 md:pt-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">Agent</h1>
      <p className="text-sm text-muted-foreground">{agentId}</p>
    </div>
  )
}
