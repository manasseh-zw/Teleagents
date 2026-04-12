import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type OrganizationIndicatorProps = {
  name: string
  memberCount: number
  logoSrc: string
  logoAlt?: string
}

function memberLabel(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "member" : "members"}`
}

export function OrganizationIndicator({
  name,
  memberCount,
  logoSrc,
  logoAlt,
}: OrganizationIndicatorProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size="lg"
          className={cn(
            "peer/menu-button group/menu-button flex h-14 w-full cursor-default items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground outline-hidden",
            "group-data-[collapsible=icon]:h-9! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:p-2!"
          )}
        >
          <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-background">
            <img
              src={logoSrc}
              alt={logoAlt ?? ""}
              className="size-full object-cover"
              decoding="async"
            />
          </div>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-lg truncate">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {memberLabel(memberCount)}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
