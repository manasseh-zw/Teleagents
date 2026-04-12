import { describe, expect, it, vi } from "vitest"
import { apiRequest, buildApiUrl, serializeQuery } from "@/lib/utils/api"

function createJsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  })
}

describe("serializeQuery", () => {
  it("serializes primitives and skips nullish values", () => {
    expect(
      serializeQuery({
        search: "support",
        pageSize: 20,
        isActive: true,
        empty: undefined,
        absent: null,
      })
    ).toBe("search=support&pageSize=20&isActive=true")
  })
})

describe("buildApiUrl", () => {
  it("joins the base url, endpoint, and query string", () => {
    expect(
      buildApiUrl("/api/agents", { search: "sales" }, "http://localhost:5047")
    ).toBe("http://localhost:5047/api/agents?search=sales")
  })
})

describe("apiRequest", () => {
  it("sends JSON bodies with the correct header", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      createJsonResponse({ ok: true }, { status: 200 })
    )

    await apiRequest("/api/agents", {
      method: "POST",
      body: { search: "sales" },
      fetch: fetchImplementation as unknown as typeof fetch,
    })

    expect(fetchImplementation).toHaveBeenCalledWith(
      "http://localhost:5047/api/agents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ search: "sales" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    )
  })

  it("normalizes string array errors", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      createJsonResponse(["Agent not found"], {
        status: 400,
        statusText: "Bad Request",
      })
    )

    await expect(
      apiRequest("/api/agents/missing", {
        fetch: fetchImplementation as unknown as typeof fetch,
      })
    ).rejects.toEqual(
      expect.objectContaining({
        name: "ApiRequestError",
        status: 400,
        message: "Agent not found",
        errors: ["Agent not found"],
      })
    )
  })

  it("normalizes string errors", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      createJsonResponse("Something went wrong", {
        status: 400,
        statusText: "Bad Request",
      })
    )

    await expect(
      apiRequest("/api/call-logs", {
        fetch: fetchImplementation as unknown as typeof fetch,
      })
    ).rejects.toEqual(
      expect.objectContaining({
        status: 400,
        message: "Something went wrong",
        errors: ["Something went wrong"],
      })
    )
  })

  it("returns the raw response when requested", async () => {
    const response = new Response("raw-data", {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
    const fetchImplementation = vi.fn().mockResolvedValue(response)

    const result = await apiRequest("/api/call-logs/conversation/audio", {
      responseType: "raw",
      fetch: fetchImplementation as unknown as typeof fetch,
    })

    expect(result).toBe(response)
  })
})
