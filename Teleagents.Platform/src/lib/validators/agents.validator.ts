import { z } from "zod"
import type { GetAgentsParams } from "@/lib/types/agents"

export const agentIdSchema = z.string().uuid()

const getAgentsParamsSchema = z
  .object({
    search: z.string().optional(),
    isActive: z.boolean().optional(),
    cursor: z.string().optional(),
    pageSize: z.number().int().positive().max(100).optional(),
  })
  .strict()

export function parseAgentId(input: unknown) {
  return agentIdSchema.parse(input)
}

export function parseGetAgentsParams(input: unknown): GetAgentsParams {
  const parsed = getAgentsParamsSchema.parse(input ?? {})
  const search = parsed.search?.trim()
  const cursor = parsed.cursor?.trim()

  return {
    ...(search ? { search } : {}),
    ...(typeof parsed.isActive === "boolean" ? { isActive: parsed.isActive } : {}),
    ...(cursor ? { cursor } : {}),
    ...(typeof parsed.pageSize === "number" ? { pageSize: parsed.pageSize } : {}),
  }
}
