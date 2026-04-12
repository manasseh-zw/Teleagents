import DashboardNavigation from "@/components/sidebar/nav-main"
import type { SidebarRoute } from "@/components/sidebar/navigation"

import { cn } from "@/lib/utils"

export function NavSecondary({ routes }: { routes: SidebarRoute[] }) {
  return (
    <div
      className={cn(
        "mt-auto flex min-h-0 flex-col gap-2 pt-4",
        "group-data-[collapsible=icon]:pt-3"
      )}
    >
      <DashboardNavigation routes={routes} />
    </div>
  )
}
