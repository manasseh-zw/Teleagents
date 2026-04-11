import {
  CircleUserRoundIcon,
  HomeIcon,
  ListIcon,
  PhoneOutgoingIcon,
  Settings,
} from "lucide-react"
import type React from "react"

export type SidebarRoute = {
  id: string
  title: string
  icon?: React.ReactNode
  link: string
  subs?: {
    title: string
    link: string
    icon?: React.ReactNode
  }[]
}

export const navRoutes: SidebarRoute[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <HomeIcon className="size-[18px]" />,
    link: "/",
  },
  {
    id: "agents",
    title: "Agents",
    icon: <CircleUserRoundIcon className="size-[18px]" />,
    link: "/agents",
  },
  {
    id: "outbound",
    title: "Outbound",
    icon: <PhoneOutgoingIcon className="size-[18px]" />,
    link: "/outbound",
  },
  {
    id: "call-history",
    title: "Call History",
    icon: <ListIcon className="size-[18px]" />,
    link: "/call-history",
  },
  {
    id: "settings",
    title: "Settings",
    icon: <Settings className="size-[18px]" />,
    link: "/settings",
  },
]
