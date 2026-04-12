import { Moon, Sun } from "lucide-react"
import { motion } from "motion/react"
import { useCallback } from "react"
import { useControllableState } from "@/hooks/use-controllable-state"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import type { ThemePreference } from "@/lib/theme"

const themes: Array<{
  key: ThemePreference
  icon: typeof Sun
  label: string
}> = [
  { key: "light", icon: Sun, label: "Light theme" },
  { key: "dark", icon: Moon, label: "Dark theme" },
]

export type ThemeSwitcherProps = {
  value?: ThemePreference
  onChange?: (theme: ThemePreference) => void
  defaultValue?: ThemePreference
  className?: string
}

export const ThemeSwitcher = ({
  value,
  onChange,
  defaultValue = "light",
  className,
}: ThemeSwitcherProps) => {
  const [theme, setTheme] = useControllableState({
    defaultProp: defaultValue,
    prop: value,
    onChange,
  })

  const handleThemeClick = useCallback(
    (themeKey: ThemePreference) => {
      setTheme(themeKey)
    },
    [setTheme]
  )

  return (
    <div
      className={cn(
        "relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border",
        className
      )}
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key

        return (
          <button
            aria-label={label}
            aria-pressed={isActive}
            className="relative h-6 w-6 rounded-full"
            key={key}
            onClick={() => handleThemeClick(key)}
            type="button"
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
                layoutId="activeTheme"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <Icon
              className={cn(
                "relative z-10 m-auto h-4 w-4",
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export function AppThemeSwitcher({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()

  return (
    <ThemeSwitcher
      className={className}
      value={preference}
      onChange={setPreference}
    />
  )
}
