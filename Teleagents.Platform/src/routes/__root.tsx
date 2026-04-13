import { useRef } from "react"
import { DashboardSidebar } from "@/components/sidebar/app-sidebar"
import { ContentHeader } from "@/components/sidebar/content-header"
import { ThemeProvider } from "@/components/theme-provider"
import { ScrollContainerProvider } from "@/components/ui/scroll-container-context"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getThemeServerFn } from "@/lib/theme"
import type { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"

import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  loader: () => getThemeServerFn(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Teleagents" },
      { name: "apple-mobile-web-app-title", content: "Teleagents" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon-96x96.png",
        sizes: "96x96",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootApp,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { resolved } = Route.useLoaderData()

  return (
    <html
      lang="en"
      className={resolved === "dark" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootApp() {
  const { queryClient } = Route.useRouteContext()
  const themeData = Route.useLoaderData()
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  return (
    <ThemeProvider data={themeData}>
      <QueryClientProvider client={queryClient}>
        <ScrollContainerProvider scrollContainerRef={scrollContainerRef}>
          <TooltipProvider>
            <SidebarProvider>
              <div className="relative flex h-dvh w-full">
                <DashboardSidebar />
                <SidebarInset className="flex flex-col overflow-hidden">
                  <ContentHeader />
                  <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-auto p-4 md:p-6"
                  >
                    <Outlet />
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </ScrollContainerProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
