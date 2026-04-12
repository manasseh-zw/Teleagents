export type CallLogConversationStatus =
  | "Initiated"
  | "InProgress"
  | "Processing"
  | "Done"
  | "Failed"

export type CallLogDirection = "Inbound" | "Outbound"

export interface GetCallLogsParams {
  agentId?: string
  cursor?: string
  pageSize?: number
  startedAfterUtc?: string
  startedBeforeUtc?: string
}

export interface CallLogSummary {
  conversationId: string
  agentId: string
  agentDisplayName: string
  status: CallLogConversationStatus | null
  direction: CallLogDirection | null
  isSuccessful: boolean | null
  startTimeUtc: string | null
  durationSeconds: number
  mainLanguage: string
  summaryTitle: string
  transcriptSummary: string
  terminationReason: string
}

export interface CallLogTranscriptTurn {
  role: string
  message: string
  originalMessage: string
  timeInCallSeconds: number | null
  interrupted: boolean
  sourceMedium: string
}

export interface CallLogDetail extends CallLogSummary {
  hasAudio: boolean
  hasUserAudio: boolean
  hasResponseAudio: boolean
  transcript: CallLogTranscriptTurn[]
}

export interface CallLogAudioMetadata {
  conversationId: string
  agentId: string
  agentDisplayName: string
  hasAudio: boolean
  contentType: string
  fileName: string
}

export interface PaginatedCallLogs {
  items: CallLogSummary[]
  hasMore: boolean
  nextCursor: string
}
