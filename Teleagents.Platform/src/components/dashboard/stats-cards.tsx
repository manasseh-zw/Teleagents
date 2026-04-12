import { dashboardStats } from "@/data/dashboard"

const stats = [
  { title: "Number of calls", value: dashboardStats.totalCalls.toLocaleString() },
  { title: "Average duration", value: dashboardStats.avgDuration },
  { title: "Total cost", value: dashboardStats.totalCost, unit: dashboardStats.totalCostUnit },
  { title: "Average cost", value: dashboardStats.avgCost.toLocaleString(), unit: dashboardStats.avgCostUnit },
  { title: "Total LLM cost", value: dashboardStats.totalLLMCost },
]

export function StatsCards() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card px-5 py-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground leading-none">{stat.title}</p>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[28px] font-semibold tracking-tight leading-none truncate">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-xs text-muted-foreground shrink-0">{stat.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
