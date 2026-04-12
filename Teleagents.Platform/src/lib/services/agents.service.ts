import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { apiRequest } from "@/lib/utils/api"
import type { AgentDetail, AgentSummary, GetAgentsParams } from "@/lib/types/agents"
import { parseAgentId, parseGetAgentsParams } from "@/lib/validators/agents.validator"

interface AgentsResponsePayload {
  items: AgentSummary[]
}

export async function fetchAgentsFromApi(params: GetAgentsParams = {}) {
  const normalizedParams = parseGetAgentsParams(params)
  const response = (await apiRequest<AgentsResponsePayload>("/api/agents", {
    query: normalizedParams,
  })) as AgentsResponsePayload

  return response.items
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

  detailQueryOptions(agentId: string) {
    const normalizedAgentId = parseAgentId(agentId)

    return queryOptions({
      queryKey: agentsService.queryKeys.detail(normalizedAgentId),
      queryFn: () => agentsService.detail(normalizedAgentId),
    })
  },
}
