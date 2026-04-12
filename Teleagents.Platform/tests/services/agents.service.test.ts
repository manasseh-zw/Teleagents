import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/lib/utils/api"
import {
  agentsService,
  fetchAgentDetailFromApi,
  fetchAgentsFromApi,
} from "@/lib/services/agents.service"

vi.mock("@/lib/utils/api", () => ({
  apiRequest: vi.fn(),
}))

const mockedApiRequest = vi.mocked(apiRequest)

describe("agents.service", () => {
  beforeEach(() => {
    mockedApiRequest.mockReset()
  })

  it("resolves the agents list endpoint", async () => {
    mockedApiRequest.mockResolvedValue({
      items: [],
    })

    await fetchAgentsFromApi({
      search: "sales",
      isActive: true,
    })

    expect(mockedApiRequest).toHaveBeenCalledWith("/api/agents", {
      query: {
        search: "sales",
        isActive: true,
      },
    })
  })

  it("resolves the agent detail endpoint", async () => {
    mockedApiRequest.mockResolvedValue({
      id: "5cf54839-768a-46c8-b8b0-80e618f1f7f1",
    })

    await fetchAgentDetailFromApi("5cf54839-768a-46c8-b8b0-80e618f1f7f1")

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/api/agents/5cf54839-768a-46c8-b8b0-80e618f1f7f1"
    )
  })

  it("produces stable query keys", () => {
    expect(
      agentsService.queryKeys.list({ search: "sales", isActive: true })
    ).toEqual(agentsService.queryKeys.list({ search: "sales", isActive: true }))
  })
})
