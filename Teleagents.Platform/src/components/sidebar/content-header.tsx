import { OrganizationUsageIndicator } from "@/components/organization-usage-indicator"
import { allNavLinks } from "@/components/sidebar/nav-links"
import { AppThemeSwitcher } from "@/components/theme-switcher"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useRouterState } from "@tanstack/react-router"

function getRouteTitle(pathname: string) {
  const activeRoute = [...allNavLinks]
    .sort((routeA, routeB) => routeB.link.length - routeA.link.length)
    .find((route) =>
      route.link === "/" ? pathname === "/" : pathname.startsWith(route.link)
    )

  if (activeRoute) {
    return activeRoute.title
  }

  const fallbackSegment = pathname.split("/").filter(Boolean).at(-1)

  if (!fallbackSegment) {
    return "Dashboard"
  }

  return fallbackSegment
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function ContentHeader() {
  const { location } = useRouterState()
  const routeTitle = getRouteTitle(location.pathname)

  return (
    <header className="flex h-13 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{routeTitle}</p>
      </div>
      <OrganizationUsageIndicator used={1200} cap={3600} label="Used" />
      <AppThemeSwitcher />
    </header>
  )
}
