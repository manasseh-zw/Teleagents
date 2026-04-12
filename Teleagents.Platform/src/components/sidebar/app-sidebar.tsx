import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { OrganizationIndicator } from "@/components/organization-indicator"
import DashboardNavigation from "@/components/sidebar/nav-main"
import { navRoutes } from "@/components/sidebar/navigation"
import { Logo } from "../logo"

export function DashboardSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-3 md:pt-3.5">
        <a
          href="/"
          className="flex items-center gap-[2px] group-data-[layout=collapsed]:justify-center"
        >
          <Logo className="h-7 w-7 shrink-0" />
          <span className="font-logo text-xl font-normal tracking-tight text-black group-data-[collapsible=icon]:hidden dark:text-white">
            Teleagents
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-3 py-4">
        <DashboardNavigation routes={navRoutes} />
      </SidebarContent>
      <SidebarFooter className="px-3">
        <OrganizationIndicator
          name="CBZ Holdings"
          memberCount={1}
          logoSrc="/cbz-logo.webp"
          logoAlt="CBZ"
        />
      </SidebarFooter>
    </Sidebar>
  )
}
