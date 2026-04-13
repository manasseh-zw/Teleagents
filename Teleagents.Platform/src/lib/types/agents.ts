export type AgentProvider = "ElevenLabs"

export interface GetAgentsParams {
  search?: string
  isActive?: boolean
  cursor?: string
  pageSize?: number
}

export interface PaginatedAgentsResponse {
  items: AgentSummary[]
  hasMore: boolean
  nextCursor: string
}

export interface AgentSummary {
  id: string
  displayName: string
  description: string
  avatarUrl: string
  assignedPhoneNumber: string
  isActive: boolean
  provider: AgentProvider
  providerAgentId: string
  createdAtUtc: string
  providerCreatedAtUtc: string | null
  lastCallAtUtc: string | null
}

export interface AgentPhoneNumber {
  phoneNumber: string
  label: string
  providerType: string
}

export interface AgentDetail {
  id: string
  displayName: string
  description: string
  avatarUrl: string
  assignedPhoneNumber: string
  isActive: boolean
  provider: AgentProvider
  providerAgentId: string
  systemPrompt: string
  firstMessage: string
  language: string
  phoneNumbers: AgentPhoneNumber[]
  knowledgeBaseIds: string[]
  toolIds: string[]
  createdAtUtc: string
  providerCreatedAtUtc: string | null
  providerUpdatedAtUtc: string | null
}
