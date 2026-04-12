import { createFileRoute } from "@tanstack/react-router"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { CallVolumeChart } from "@/components/dashboard/call-volume-chart"
import { MostCalledAgents } from "@/components/dashboard/most-called-agents"
import { RecentCallsTable } from "@/components/dashboard/recent-calls-table"

export const Route = createFileRoute("/")({ component: DashboardPage })

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          My Workspace
        </p>
        <h1 className="text-2xl font-normal tracking-tight">
          {getGreeting()}, Manasseh
        </h1>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CallVolumeChart />
        </div>
        <MostCalledAgents />
      </div>

      <RecentCallsTable />
    </div>
  )
}
