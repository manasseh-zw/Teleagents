import { createServerFn } from "@tanstack/react-start"
import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server"

export const THEME_COOKIE = "_preferred-theme"

export type ThemePreference = "light" | "dark"
export type ResolvedTheme = "light" | "dark"

export type ThemeLoaderData = {
  preference: ThemePreference | null
  resolved: ResolvedTheme
}

function parsePreference(value: string | undefined): ThemePreference | null {
  if (value === "dark" || value === "light") return value
  return null
}

function resolveFromPreference(
  preference: ThemePreference | null
): ResolvedTheme {
  if (preference === "dark") return "dark"
  if (preference === "light") return "light"
  try {
    const ch = getRequest()
      .headers.get("sec-ch-prefers-color-scheme")
      ?.toLowerCase()
    if (ch === "dark") return "dark"
  } catch {
    /* not in request context */
  }
  return "light"
}

export const getThemeServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ThemeLoaderData> => {
    const preference = parsePreference(getCookie(THEME_COOKIE))
    const resolved = resolveFromPreference(preference)
    return { preference, resolved }
  }
)

export const setThemeServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): ThemePreference => {
    if (data === "light" || data === "dark") return data
    throw new Error("Invalid theme")
  })
  .handler(async ({ data }) => {
    setCookie(THEME_COOKIE, data, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  })
