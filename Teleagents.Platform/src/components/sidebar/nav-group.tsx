"use client"

import type { SidebarRoute } from "@/components/sidebar/nav-links"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Link, useRouterState } from "@tanstack/react-router"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

export function NavGroup({ routes }: { routes: SidebarRoute[] }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null)
  const { location } = useRouterState()

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const isOpen = !isCollapsed && openCollapsible === route.id
        const hasSubRoutes = !!route.subs?.length
        const isActive =
          route.link === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(route.link)

        return (
          <SidebarMenuItem key={route.id}>
            {hasSubRoutes ? (
              <Collapsible
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenCollapsible(open ? route.id : null)
                }
                className="w-full"
              >
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      className={cn(
                        "flex w-full items-center rounded-lg px-2 group-data-[layout=collapsed]:justify-center",
                        isOpen || isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent-hover"
                          : "text-muted-foreground transition-colors hover:text-sidebar-hover-foreground"
                      )}
                    />
                  }
                >
                  {route.icon}
                  <span className="ml-2 flex-1 text-[15px] font-medium group-data-[collapsible=icon]:hidden">
                    {route.title}
                  </span>
                  {hasSubRoutes && (
                    <span className="ml-auto group-data-[collapsible=icon]:hidden">
                      {isOpen ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  )}
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub className="my-1 ml-3.5">
                    {route.subs?.map((subRoute) => (
                      <SidebarMenuSubItem
                        key={`${route.id}-${subRoute.title}`}
                        className="h-auto"
                      >
                        <SidebarMenuSubButton
                          render={
                            <Link
                              to={subRoute.link as "/"}
                              className="flex items-center rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            />
                          }
                        >
                          {subRoute.title}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuButton
                tooltip={route.title}
                className={cn(
                  "flex items-center rounded-lg px-2 group-data-[layout=collapsed]:justify-center",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent-hover"
                    : "text-muted-foreground transition-colors hover:text-sidebar-hover-foreground"
                )}
                render={<Link to={route.link as "/"} />}
              >
                {route.icon}
                <span className="ml-2 text-[15px] font-medium group-data-[collapsible=icon]:hidden">
                  {route.title}
                </span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
