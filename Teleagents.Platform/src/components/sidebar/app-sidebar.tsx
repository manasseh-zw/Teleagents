import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { OrganizationIndicator } from "@/components/organization-indicator"
import {
  mainNavLinks,
  secondaryNavLinks,
} from "@/components/sidebar/nav-links"
import { NavGroup } from "@/components/sidebar/nav-group"
import { UserAccountIndicator } from "@/components/user-account-indicator"
import { cn } from "@/lib/utils"
import { Logo } from "../logo"

export function DashboardSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="space-y-3 px-4 pb-2 group-data-[layout=collapsed]:px-3 md:pt-3.5">
        <a
          href="/"
          className="flex items-center gap-[2px] text-black group-data-[layout=collapsed]:justify-center dark:text-sidebar-foreground/88"
        >
          <Logo className="h-7 w-7 shrink-0 text-current" />
          <span className="font-logo text-xl font-normal tracking-tight text-current group-data-[collapsible=icon]:hidden">
            Teleagents
          </span>
        </a>
        <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 px-2 py-2 group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 dark:bg-sidebar-accent/25">
          <OrganizationIndicator
            name="CBZ Holdings"
            memberCount={1}
            logoSrc="/cbz-logo.webp"
            logoAlt="CBZ"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="flex min-h-0 flex-1 flex-col gap-0 px-4 py-4 group-data-[layout=collapsed]:px-3">
        <NavGroup routes={mainNavLinks} />
        <div
          className={cn(
            "mt-auto flex min-h-0 flex-col gap-2 pt-4",
            "group-data-[collapsible=icon]:pt-3"
          )}
        >
          <NavGroup routes={secondaryNavLinks} />
        </div>
      </SidebarContent>
      <SidebarFooter className="px-3 pb-2">
        <UserAccountIndicator
          avatarSrc="/me.png"
          name="Manasseh"
          email="manasseh@cbz.co.zw"
        />
      </SidebarFooter>
    </Sidebar>
  )
}
