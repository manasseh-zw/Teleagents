import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/settings")({ component: SettingsPage })

function SettingsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
    </div>
  )
}
