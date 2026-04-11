namespace Teleagents.Providers.Abstractions.Contracts;

public record VoiceProviderListAgentsRequest(
    IReadOnlyList<string>? ProviderAgentIds = null,
    string Search = "",
    bool IncludeArchived = false,
    int PageSize = 30,
    string Cursor = ""
);

public record VoiceProviderAgentListItem(
    string ProviderAgentId,
    string Name,
    bool IsArchived,
    IReadOnlyList<string> Tags,
    DateTime? CreatedAtUtc,
    DateTime? LastCallAtUtc
);

public record VoiceProviderAgentDetailResponse(
    string ProviderAgentId,
    string Name,
    IReadOnlyList<string> Tags,
    DateTime? CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    string BranchId,
    string MainBranchId,
    string VersionId,
    string SystemPrompt,
    string FirstMessage,
    string Language,
    IReadOnlyList<VoiceProviderPhoneNumber> PhoneNumbers,
    IReadOnlyList<string> KnowledgeBaseIds,
    IReadOnlyList<string> ToolIds
);

public record VoiceProviderPhoneNumber(string PhoneNumber, string Label, string ProviderType);

public record VoiceProviderListConversationsRequest(
    string ProviderAgentId = "",
    string BranchId = "",
    string Cursor = "",
    int PageSize = 30,
    DateTime? StartedAfterUtc = null,
    DateTime? StartedBeforeUtc = null,
    int? MinDurationSeconds = null,
    int? MaxDurationSeconds = null,
    VoiceProviderConversationDirection? Direction = null,
    VoiceProviderConversationStatus? Status = null,
    bool? Success = null,
    bool IncludeSummaries = true
);

public record VoiceProviderConversationListItem(
    string ConversationId,
    string ProviderAgentId,
    string AgentName,
    string BranchId,
    DateTime? StartTimeUtc,
    int DurationSeconds,
    VoiceProviderConversationStatus? Status,
    VoiceProviderConversationDirection? Direction,
    bool? IsSuccessful,
    int MessageCount,
    string MainLanguage,
    string SummaryTitle,
    string TranscriptSummary,
    string TerminationReason
);

public record VoiceProviderConversationDetailResponse(
    string ConversationId,
    string ProviderAgentId,
    string AgentName,
    string BranchId,
    DateTime? StartTimeUtc,
    int DurationSeconds,
    VoiceProviderConversationStatus? Status,
    VoiceProviderConversationDirection? Direction,
    bool? IsSuccessful,
    int MessageCount,
    string MainLanguage,
    string SummaryTitle,
    string TranscriptSummary,
    string TerminationReason,
    bool HasAudio,
    bool HasUserAudio,
    bool HasResponseAudio,
    string Environment,
    string VersionId,
    string UserId,
    IReadOnlyList<VoiceProviderTranscriptTurn> Transcript,
    string RawTranscriptPayload
);

public record VoiceProviderConversationAudioMetadataResponse(
    bool HasAudio,
    string ContentType,
    string FileName
);

public record VoiceProviderConversationAudioResponse(
    Stream AudioStream,
    string ContentType,
    string FileName
);

public record VoiceProviderTranscriptTurn(
    string Role,
    string Message,
    string OriginalMessage,
    int? TimeInCallSeconds,
    bool Interrupted,
    string SourceMedium
);

public record VoiceProviderPagedResponse<T>(
    IReadOnlyList<T> Items,
    bool HasMore,
    string NextCursor
);

public enum VoiceProviderConversationDirection
{
    Inbound,
    Outbound,
}

public enum VoiceProviderConversationStatus
{
    Initiated,
    InProgress,
    Processing,
    Done,
    Failed,
}
