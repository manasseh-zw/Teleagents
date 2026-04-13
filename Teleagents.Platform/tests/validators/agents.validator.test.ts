import { describe, expect, it } from "vitest"
import { parseAgentId, parseGetAgentsParams } from "@/lib/validators/agents.validator"

describe("agents.validator", () => {
  it("trims and normalizes list params", () => {
    expect(
      parseGetAgentsParams({
        search: "  sales  ",
        isActive: true,
        cursor: "  cursor-1  ",
        pageSize: 25,
      })
    ).toEqual({
      search: "sales",
      isActive: true,
      cursor: "cursor-1",
      pageSize: 25,
    })
  })

  it("rejects invalid agent ids", () => {
    expect(() => parseAgentId("not-a-guid")).toThrow()
  })
})
