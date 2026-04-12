import { useRouter } from "@tanstack/react-router"
import {
  createContext,
  type PropsWithChildren,
  use,
  useLayoutEffect,
  useState,
} from "react"
import {
  setThemeServerFn,
  type ResolvedTheme,
  type ThemeLoaderData,
  type ThemePreference,
} from "@/lib/theme"

type ThemeContextValue = {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (value: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = PropsWithChildren<{ data: ThemeLoaderData }>

export function ThemeProvider({ children, data }: ThemeProviderProps) {
  const router = useRouter()
  const { preference: storedPreference, resolved } = data
  const [clientResolved, setClientResolved] = useState<ResolvedTheme>(resolved)

  useLayoutEffect(() => {
    if (storedPreference) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => {
      const nextResolved = mq.matches ? "dark" : "light"
      setClientResolved(nextResolved)
      document.documentElement.classList.toggle("dark", nextResolved === "dark")
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [storedPreference])

  function setPreference(value: ThemePreference) {
    void setThemeServerFn({ data: value }).then(() => router.invalidate())
  }

  const activePreference = storedPreference ?? clientResolved

  return (
    <ThemeContext.Provider
      value={{ preference: activePreference, resolved: clientResolved, setPreference }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const value = use(ThemeContext)
  if (!value) throw new Error("useTheme must be used within ThemeProvider")
  return value
}
