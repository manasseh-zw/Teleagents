import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/support")({ component: SupportPage })

function SupportPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Support</h1>
      <p className="text-sm text-muted-foreground">
        Get help with Teleagents, billing, and technical issues.
      </p>
    </div>
  )
}
