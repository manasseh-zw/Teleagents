import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/agents")({ component: AgentsPage })

function AgentsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Agents</h1>
      <p className="text-sm text-muted-foreground">Manage your voice agents.</p>
    </div>
  )
}
