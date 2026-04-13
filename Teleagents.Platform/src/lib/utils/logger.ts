type LoggerLevel = "debug" | "info" | "warn" | "error"

interface LoggerEntry {
  level: LoggerLevel
  scope: string
  message: string
  details?: object
  timestamp: string
  runtime: "client" | "server"
}

declare global {
  interface Window {
    __teleagentsLogs?: LoggerEntry[]
  }
}

const MAX_STORED_LOGS = 200

function isClientRuntime() {
  return !import.meta.env.SSR && typeof window !== "undefined"
}

function writeToConsole(level: LoggerLevel, entry: LoggerEntry) {
  const consoleMethod =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error

  consoleMethod(
    `[${entry.scope}] ${entry.message}`,
    {
      runtime: entry.runtime,
      timestamp: entry.timestamp,
      ...(entry.details ?? {}),
    }
  )
}

function storeClientLog(entry: LoggerEntry) {
  if (!isClientRuntime()) {
    return
  }

  const existingLogs = window.__teleagentsLogs ?? []
  const nextLogs = [...existingLogs, entry].slice(-MAX_STORED_LOGS)
  window.__teleagentsLogs = nextLogs
}

export function createLogger(scope: string) {
  const runtime = isClientRuntime() ? "client" : "server"

  function log(level: LoggerLevel, message: string, details?: object) {
    const entry: LoggerEntry = {
      level,
      scope,
      message,
      details,
      timestamp: new Date().toISOString(),
      runtime,
    }

    storeClientLog(entry)
    writeToConsole(level, entry)
  }

  return {
    debug(message: string, details?: object) {
      log("debug", message, details)
    },
    info(message: string, details?: object) {
      log("info", message, details)
    },
    warn(message: string, details?: object) {
      log("warn", message, details)
    },
    error(message: string, details?: object) {
      log("error", message, details)
    },
  }
}
