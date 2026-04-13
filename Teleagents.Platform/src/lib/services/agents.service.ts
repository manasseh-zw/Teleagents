import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { createLogger } from "@/lib/utils/logger"
import { apiRequest } from "@/lib/utils/api"
import type { AgentDetail, GetAgentsParams, PaginatedAgentsResponse } from "@/lib/types/agents"
import { parseAgentId, parseGetAgentsParams } from "@/lib/validators/agents.validator"

const DEBUG_AGENTS_INFINITE_SCROLL = import.meta.env.DEV
const logger = createLogger("agents-infinite")

export async function fetchAgentsFromApi(params: GetAgentsParams = {}) {
  const normalizedParams = parseGetAgentsParams(params)
  const response = (await apiRequest<PaginatedAgentsResponse>("/api/agents", {
    query: normalizedParams,
  })) as PaginatedAgentsResponse

  return response
}

export async function fetchAgentDetailFromApi(agentId: string) {
  const normalizedAgentId = parseAgentId(agentId)

  return (await apiRequest<AgentDetail>(`/api/agents/${normalizedAgentId}`)) as AgentDetail
}

const listAgentsServerFn = createServerFn({ method: "GET" })
  .inputValidator(parseGetAgentsParams)
  .handler(async ({ data }) => fetchAgentsFromApi(data))

const getAgentDetailServerFn = createServerFn({ method: "GET" })
  .inputValidator(parseAgentId)
  .handler(async ({ data }) => fetchAgentDetailFromApi(data))

function normalizeParams(params: GetAgentsParams = {}) {
  return parseGetAgentsParams(params)
}

function normalizePageParam(pageParam: unknown) {
  return typeof pageParam === "string" && pageParam ? pageParam : undefined
}

export const agentsService = {
  queryKeys: {
    all: () => ["agents"] as const,
    lists: () => [...agentsService.queryKeys.all(), "list"] as const,
    list: (params: GetAgentsParams = {}) =>
      [...agentsService.queryKeys.lists(), normalizeParams(params)] as const,
    details: () => [...agentsService.queryKeys.all(), "detail"] as const,
    detail: (agentId: string) =>
      [...agentsService.queryKeys.details(), parseAgentId(agentId)] as const,
  },

  list(params: GetAgentsParams = {}) {
    const normalizedParams = normalizeParams(params)

    return listAgentsServerFn({ data: normalizedParams })
  },

  detail(agentId: string) {
    const normalizedAgentId = parseAgentId(agentId)

    return getAgentDetailServerFn({ data: normalizedAgentId })
  },

  listQueryOptions(params: GetAgentsParams = {}) {
    const normalizedParams = normalizeParams(params)

    return queryOptions({
      queryKey: agentsService.queryKeys.list(normalizedParams),
      queryFn: () => agentsService.list(normalizedParams),
    })
  },

  listInfiniteQueryOptions(params: GetAgentsParams = {}) {
    const normalizedParams = normalizeParams(params)

    return infiniteQueryOptions({
      queryKey: agentsService.queryKeys.list(normalizedParams),
      initialPageParam: "",
      queryFn: async ({ pageParam }) => {
        const cursor = normalizePageParam(pageParam)
        if (DEBUG_AGENTS_INFINITE_SCROLL) {
          logger.info("request:start", {
          cursor: cursor ?? "",
          pageSize: normalizedParams.pageSize ?? null,
          search: normalizedParams.search ?? "",
          })
        }

        const response = await agentsService.list({
          ...normalizedParams,
          ...(cursor ? { cursor } : {}),
        })

        if (DEBUG_AGENTS_INFINITE_SCROLL) {
          logger.info("request:success", {
            cursor: cursor ?? "",
            items: response.items.length,
            hasMore: response.hasMore,
            nextCursor: response.nextCursor,
          })
        }

        return response
      },
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextCursor : undefined,
    })
  },

  detailQueryOptions(agentId: string) {
    const normalizedAgentId = parseAgentId(agentId)

    return queryOptions({
      queryKey: agentsService.queryKeys.detail(normalizedAgentId),
      queryFn: () => agentsService.detail(normalizedAgentId),
    })
  },
}
