import { serverConfig } from "@/configs/server.config"
import type { ApiError } from "@/lib/types/api"

export type ApiQueryValue = string | number | boolean | null | undefined

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | FormData | object | null
  query?: object
  responseType?: "json" | "raw"
  fetch?: typeof fetch
}

export class ApiRequestError extends Error implements ApiError {
  status: number
  errors: string[]

  constructor({ status, message, errors }: ApiError) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.errors = errors
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
}

export function serializeQuery(query?: object) {
  if (!query) {
    return ""
  }

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query as Record<string, ApiQueryValue>)) {
    if (value === null || typeof value === "undefined") {
      continue
    }

    params.set(key, String(value))
  }

  return params.toString()
}

export function buildApiUrl(
  endpoint: string,
  query?: object,
  baseUrl = serverConfig.apiBaseUrl
) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
  const url = new URL(normalizedEndpoint, normalizeBaseUrl(baseUrl))
  const queryString = serializeQuery(query)

  if (queryString) {
    url.search = queryString
  }

  return url.toString()
}

async function parseApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = response.statusText || "API request failed"
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as unknown

    if (Array.isArray(data)) {
      const errors = data.filter((value): value is string => typeof value === "string")

      return {
        status: response.status,
        message: errors[0] ?? fallbackMessage,
        errors,
      }
    }

    if (typeof data === "string") {
      return {
        status: response.status,
        message: data,
        errors: [data],
      }
    }
  }

  const text = await response.text()
  const message = text || fallbackMessage

  return {
    status: response.status,
    message,
    errors: [message],
  }
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData
}

function isRawBody(value: unknown): value is BodyInit {
  return (
    typeof value === "string"
    || value instanceof Blob
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value)
    || value instanceof URLSearchParams
    || value instanceof ReadableStream
  )
}

function normalizeBody(body: ApiRequestOptions["body"]) {
  if (typeof body === "undefined" || body === null) {
    return {
      body: undefined,
      isJson: false,
    }
  }

  if (isFormData(body) || isRawBody(body)) {
    return {
      body,
      isJson: false,
    }
  }

  return {
    body: JSON.stringify(body),
    isJson: true,
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T | Response> {
  const {
    body,
    fetch: fetchImplementation = fetch,
    headers,
    query,
    responseType = "json",
    ...requestInit
  } = options

  const normalizedBody = normalizeBody(body)
  const response = await fetchImplementation(buildApiUrl(endpoint, query), {
    ...requestInit,
    body: normalizedBody.body,
    headers: {
      ...(normalizedBody.isJson ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    throw new ApiRequestError(await parseApiError(response))
  }

  if (responseType === "raw") {
    return response
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
