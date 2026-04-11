import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/outbound")({ component: OutboundPage })

function OutboundPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Outbound</h1>
      <p className="text-sm text-muted-foreground">
        Assign agents to place outbound calls to your target numbers.
      </p>
    </div>
  )
}
