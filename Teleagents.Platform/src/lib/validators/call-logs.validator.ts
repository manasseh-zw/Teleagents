import type { GetCallLogsParams } from "@/lib/types/call-logs"
import { z } from "zod"

export const conversationIdSchema = z.string().trim().min(1)

const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime())

const getCallLogsParamsSchema = z
  .object({
    agentId: z.string().uuid().optional(),
    cursor: z.string().optional(),
    pageSize: z.number().int().positive().optional(),
    startedAfterUtc: isoDateTimeSchema.optional(),
    startedBeforeUtc: isoDateTimeSchema.optional(),
  })
  .strict()

export function parseConversationId(input: unknown) {
  return conversationIdSchema.parse(input)
}

export function parseGetCallLogsParams(input: unknown): GetCallLogsParams {
  const parsed = getCallLogsParamsSchema.parse(input ?? {})
  const cursor = parsed.cursor?.trim()

  return {
    ...(parsed.agentId ? { agentId: parsed.agentId } : {}),
    ...(cursor ? { cursor } : {}),
    ...(typeof parsed.pageSize === "number"
      ? { pageSize: parsed.pageSize }
      : {}),
    ...(parsed.startedAfterUtc
      ? { startedAfterUtc: parsed.startedAfterUtc }
      : {}),
    ...(parsed.startedBeforeUtc
      ? { startedBeforeUtc: parsed.startedBeforeUtc }
      : {}),
  }
}
