import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/sidebar/logo"
import DashboardNavigation from "@/components/sidebar/nav-main"
import { navRoutes } from "@/components/sidebar/navigation"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"

const teams = [
  { id: "1", name: "Alpha Inc.", logo: Logo, plan: "Free" },
  { id: "2", name: "Beta Corp.", logo: Logo, plan: "Free" },
]

export function DashboardSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-3 md:pt-3.5">
        <a
          href="/"
          className="flex items-center gap-2 group-data-[layout=collapsed]:justify-center"
        >
          <Logo className="h-8 w-8 shrink-0" />
          <span className="font-semibold text-black group-data-[collapsible=icon]:hidden dark:text-white">
            Acme
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-3 py-4">
        <DashboardNavigation routes={navRoutes} />
      </SidebarContent>
      <SidebarFooter className="px-3">
        <TeamSwitcher teams={teams} />
      </SidebarFooter>
    </Sidebar>
  )
}
