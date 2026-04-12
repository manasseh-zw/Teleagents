"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ChevronDownIcon } from "lucide-react"

export type UserAccountIndicatorProps = {
  name: string
  email: string
  avatarSrc?: string
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "?"
}

export function UserAccountIndicator({
  name,
  email,
  avatarSrc,
}: UserAccountIndicatorProps) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[layout=collapsed]:justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={name}
                className={cn(
                  "data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground",
                  "group-data-[collapsible=icon]:h-9! group-data-[collapsible=icon]:w-9! group-data-[collapsible=icon]:max-w-9! group-data-[collapsible=icon]:min-w-9! group-data-[collapsible=icon]:shrink-0 group-data-[layout=collapsed]:justify-center! group-data-[collapsible=icon]:rounded-full! group-data-[collapsible=icon]:p-0!"
                )}
              />
            }
          >
            <Avatar className="size-8 shrink-0">
              {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
              <AvatarFallback className="text-xs">
                {initialsFromName(name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <ChevronDownIcon className="ml-auto size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="mb-4 min-w-56 rounded-xl"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/settings" })}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
