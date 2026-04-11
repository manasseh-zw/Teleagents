import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/call-history")({ component: CallHistoryPage })

function CallHistoryPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Call History</h1>
      <p className="text-sm text-muted-foreground">Review logs from your voice agents.</p>
    </div>
  )
}
