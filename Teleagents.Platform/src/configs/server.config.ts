const DEFAULT_DEV_API_BASE_URL = "http://localhost:5047"

function getEnvironmentVariable(name: string): string | undefined {
  if (typeof process === "undefined") {
    return undefined
  }

  return process.env[name]
}

function resolveApiBaseUrl() {
  const configuredUrl = getEnvironmentVariable("TELEAGENTS_API_BASE_URL")?.trim()

  if (configuredUrl) {
    return configuredUrl
  }

  return DEFAULT_DEV_API_BASE_URL
}

export const serverConfig = {
  apiBaseUrl: resolveApiBaseUrl(),
} as const
