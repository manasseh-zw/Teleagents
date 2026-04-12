import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { OrganizationIndicator } from "@/components/organization-indicator"
import { UserAccountIndicator } from "@/components/user-account-indicator"
import DashboardNavigation from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { navRoutes, navSecondaryRoutes } from "@/components/sidebar/navigation"
import { Logo } from "../logo"

export function DashboardSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="space-y-3 px-4 group-data-[layout=collapsed]:px-3 pb-2 md:pt-3.5">
        <a
          href="/"
          className="flex items-center gap-[2px] group-data-[layout=collapsed]:justify-center"
        >
          <Logo className="h-7 w-7 shrink-0" />
          <span className="font-logo text-xl font-normal tracking-tight text-black group-data-[collapsible=icon]:hidden dark:text-white">
            Teleagents
          </span>
        </a>
        <div className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 px-2 py-2 dark:bg-sidebar-accent/25 group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <OrganizationIndicator
            name="CBZ Holdings"
            memberCount={1}
            logoSrc="/cbz-logo.webp"
            logoAlt="CBZ"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="flex min-h-0 flex-1 flex-col gap-0 px-4 py-4 group-data-[layout=collapsed]:px-3">
        <DashboardNavigation routes={navRoutes} />
        <NavSecondary routes={navSecondaryRoutes} />
      </SidebarContent>
      <SidebarFooter className="px-3 pb-2">
        <UserAccountIndicator
          name="Manasseh"
          email="manasseh@nextsoft.com"
        />
      </SidebarFooter>
    </Sidebar>
  )
}
