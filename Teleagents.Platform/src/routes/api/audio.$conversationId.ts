import { createFileRoute } from "@tanstack/react-router"
import { buildApiUrl } from "@/lib/utils/api"

export const Route = createFileRoute("/api/audio/$conversationId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const audioUrl = buildApiUrl(
          `/api/call-logs/${params.conversationId}/audio`
        )

        const upstreamHeaders: HeadersInit = {}
        const range = request.headers.get("range")
        if (range) {
          upstreamHeaders["range"] = range
        }

        const response = await fetch(audioUrl, { headers: upstreamHeaders })

        if (!response.ok) {
          return new Response("Audio unavailable", { status: response.status })
        }

        const headers = new Headers()
        for (const key of [
          "content-type",
          "content-length",
          "content-range",
          "accept-ranges",
        ]) {
          const value = response.headers.get(key)
          if (value) headers.set(key, value)
        }
        if (!headers.has("accept-ranges")) {
          headers.set("accept-ranges", "bytes")
        }

        return new Response(response.body, {
          status: response.status,
          headers,
        })
      },
    },
  },
})
