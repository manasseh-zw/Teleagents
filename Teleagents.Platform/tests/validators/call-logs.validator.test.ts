import { describe, expect, it } from "vitest"
import {
  parseConversationId,
  parseGetCallLogsParams,
} from "@/lib/validators/call-logs.validator"

describe("call-logs.validator", () => {
  it("trims and normalizes list params", () => {
    expect(
      parseGetCallLogsParams({
        agentId: "5cf54839-768a-46c8-b8b0-80e618f1f7f1",
        cursor: "  cursor-123  ",
        pageSize: 25,
        startedAfterUtc: "2026-04-12T10:00:00Z",
      })
    ).toEqual({
      agentId: "5cf54839-768a-46c8-b8b0-80e618f1f7f1",
      cursor: "cursor-123",
      pageSize: 25,
      startedAfterUtc: "2026-04-12T10:00:00Z",
    })
  })

  it("rejects blank conversation ids", () => {
    expect(() => parseConversationId("   ")).toThrow()
  })

  it("rejects invalid page sizes", () => {
    expect(() => parseGetCallLogsParams({ pageSize: 0 })).toThrow()
  })
})
