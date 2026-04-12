import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Users } from "lucide-react"

export type OrganizationIndicatorProps = {
  name: string
  memberCount: number
  logoSrc: string
  logoAlt?: string
  className?: string
}

function memberLabel(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "member" : "members"}`
}

export function OrganizationIndicator({
  name,
  memberCount,
  logoSrc,
  logoAlt,
  className,
}: OrganizationIndicatorProps) {
  return (
    <SidebarMenu className="group-data-[collapsible=icon]:gap-0">
      <SidebarMenuItem className="group-data-[collapsible=icon]:p-0">
        <div
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size="lg"
          className={cn(
            "peer/menu-button group/menu-button flex h-11 w-full cursor-default items-center gap-3 overflow-hidden rounded-sm p-1 text-left text-sm text-sidebar-foreground outline-hidden",
            "group-data-[collapsible=icon]:flex! group-data-[collapsible=icon]:h-auto! group-data-[collapsible=icon]:min-h-0! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:gap-0! group-data-[collapsible=icon]:p-0!",
            className
          )}
        >
          <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-background group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:shrink-0 group-data-[collapsible=icon]:rounded-lg">
            <img
              src={logoSrc}
              alt={logoAlt ?? ""}
              className="size-full object-cover"
              decoding="async"
            />
          </div>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{name}</span>
            <span className="flex min-w-0 items-center gap-2 truncate text-xs font-light text-muted-foreground">
              <Users className="size-3.5 shrink-0 opacity-70" aria-hidden />
              {memberLabel(memberCount)}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
