import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { apiRequest } from "@/lib/utils/api"
import type {
  CallLogAudioMetadata,
  CallLogDetail,
  GetCallLogsParams,
  PaginatedCallLogs,
} from "@/lib/types/call-logs"
import {
  parseConversationId,
  parseGetCallLogsParams,
} from "@/lib/validators/call-logs.validator"

export async function fetchCallLogsFromApi(params: GetCallLogsParams = {}) {
  const normalizedParams = parseGetCallLogsParams(params)

  return (await apiRequest<PaginatedCallLogs>("/api/call-logs", {
    query: normalizedParams,
  })) as PaginatedCallLogs
}

export async function fetchCallLogDetailFromApi(conversationId: string) {
  const normalizedConversationId = parseConversationId(conversationId)

  return (await apiRequest<CallLogDetail>(
    `/api/call-logs/${normalizedConversationId}`
  )) as CallLogDetail
}

export async function fetchCallLogAudioMetadataFromApi(conversationId: string) {
  const normalizedConversationId = parseConversationId(conversationId)

  return (await apiRequest<CallLogAudioMetadata>(
    `/api/call-logs/${normalizedConversationId}/audio/metadata`
  )) as CallLogAudioMetadata
}

const listCallLogsServerFn = createServerFn({ method: "GET" })
  .inputValidator(parseGetCallLogsParams)
  .handler(async ({ data }) => fetchCallLogsFromApi(data))

const getCallLogDetailServerFn = createServerFn({ method: "GET" })
  .inputValidator(parseConversationId)
  .handler(async ({ data }) => fetchCallLogDetailFromApi(data))

const getCallLogAudioMetadataServerFn = createServerFn({ method: "GET" })
  .inputValidator(parseConversationId)
  .handler(async ({ data }) => fetchCallLogAudioMetadataFromApi(data))

function normalizeParams(params: GetCallLogsParams = {}) {
  return parseGetCallLogsParams(params)
}

function normalizePageParam(pageParam: unknown) {
  return typeof pageParam === "string" && pageParam ? pageParam : undefined
}

export const callLogsService = {
  queryKeys: {
    all: () => ["call-logs"] as const,
    lists: () => [...callLogsService.queryKeys.all(), "list"] as const,
    list: (params: GetCallLogsParams = {}) =>
      [...callLogsService.queryKeys.lists(), normalizeParams(params)] as const,
    details: () => [...callLogsService.queryKeys.all(), "detail"] as const,
    detail: (conversationId: string) =>
      [...callLogsService.queryKeys.details(), parseConversationId(conversationId)] as const,
    audioMetadata: (conversationId: string) =>
      [...callLogsService.queryKeys.detail(conversationId), "audio-metadata"] as const,
  },

  list(params: GetCallLogsParams = {}) {
    const normalizedParams = normalizeParams(params)

    return listCallLogsServerFn({ data: normalizedParams })
  },

  detail(conversationId: string) {
    const normalizedConversationId = parseConversationId(conversationId)

    return getCallLogDetailServerFn({ data: normalizedConversationId })
  },

  audioMetadata(conversationId: string) {
    const normalizedConversationId = parseConversationId(conversationId)

    return getCallLogAudioMetadataServerFn({ data: normalizedConversationId })
  },

  listQueryOptions(params: GetCallLogsParams = {}) {
    const normalizedParams = normalizeParams(params)

    return queryOptions({
      queryKey: callLogsService.queryKeys.list(normalizedParams),
      queryFn: () => callLogsService.list(normalizedParams),
    })
  },

  listInfiniteQueryOptions(params: GetCallLogsParams = {}) {
    const normalizedParams = normalizeParams(params)

    return infiniteQueryOptions({
      queryKey: callLogsService.queryKeys.list(normalizedParams),
      initialPageParam: "",
      queryFn: ({ pageParam }) => {
        const cursor = normalizePageParam(pageParam)

        return callLogsService.list({
          ...normalizedParams,
          ...(cursor ? { cursor } : {}),
        })
      },
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextCursor : undefined,
    })
  },

  detailQueryOptions(conversationId: string) {
    const normalizedConversationId = parseConversationId(conversationId)

    return queryOptions({
      queryKey: callLogsService.queryKeys.detail(normalizedConversationId),
      queryFn: () => callLogsService.detail(normalizedConversationId),
    })
  },

  audioMetadataQueryOptions(conversationId: string) {
    const normalizedConversationId = parseConversationId(conversationId)

    return queryOptions({
      queryKey: callLogsService.queryKeys.audioMetadata(normalizedConversationId),
      queryFn: () => callLogsService.audioMetadata(normalizedConversationId),
    })
  },
}
