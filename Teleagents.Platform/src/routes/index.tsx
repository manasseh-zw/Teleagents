import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: DashboardPage })

function DashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Overview of your Teleagents activity.</p>
    </div>
  )
}
