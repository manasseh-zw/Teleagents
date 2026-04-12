import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/lib/utils/api"
import {
  callLogsService,
  fetchCallLogAudioMetadataFromApi,
  fetchCallLogDetailFromApi,
  fetchCallLogsFromApi,
} from "@/lib/services/call-logs.service"

vi.mock("@/lib/utils/api", () => ({
  apiRequest: vi.fn(),
}))

const mockedApiRequest = vi.mocked(apiRequest)

describe("call-logs.service", () => {
  beforeEach(() => {
    mockedApiRequest.mockReset()
  })

  it("resolves the call logs list endpoint", async () => {
    mockedApiRequest.mockResolvedValue({
      items: [],
      hasMore: false,
      nextCursor: "",
    })

    await fetchCallLogsFromApi({
      agentId: "5cf54839-768a-46c8-b8b0-80e618f1f7f1",
      pageSize: 20,
    })

    expect(mockedApiRequest).toHaveBeenCalledWith("/api/call-logs", {
      query: {
        agentId: "5cf54839-768a-46c8-b8b0-80e618f1f7f1",
        pageSize: 20,
      },
    })
  })

  it("resolves the call log detail endpoint", async () => {
    mockedApiRequest.mockResolvedValue({
      conversationId: "conversation-123",
    })

    await fetchCallLogDetailFromApi("conversation-123")

    expect(mockedApiRequest).toHaveBeenCalledWith("/api/call-logs/conversation-123")
  })

  it("resolves the call log audio metadata endpoint", async () => {
    mockedApiRequest.mockResolvedValue({
      conversationId: "conversation-123",
    })

    await fetchCallLogAudioMetadataFromApi("conversation-123")

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/api/call-logs/conversation-123/audio/metadata"
    )
  })

  it("produces stable query keys", () => {
    expect(
      callLogsService.queryKeys.list({
        agentId: "5cf54839-768a-46c8-b8b0-80e618f1f7f1",
        pageSize: 20,
      })
    ).toEqual(
      callLogsService.queryKeys.list({
        agentId: "5cf54839-768a-46c8-b8b0-80e618f1f7f1",
        pageSize: 20,
      })
    )
  })
})
