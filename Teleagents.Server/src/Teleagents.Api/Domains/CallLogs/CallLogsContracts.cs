namespace Teleagents.Api.Domains.CallLogs;

public record GetCallLogsRequest
{
    public Guid? AgentId { get; init; }
    public string Cursor { get; init; } = string.Empty;
    public int PageSize { get; init; } = 20;
    public DateTime? StartedAfterUtc { get; init; }
    public DateTime? StartedBeforeUtc { get; init; }
}

public record GetCallLogsResponse(
    IReadOnlyList<GetCallLogListItem> Items,
    bool HasMore,
    string NextCursor
);

public record GetCallLogListItem(
    string ConversationId,
    Guid AgentId,
    string AgentDisplayName,
    CallLogConversationStatus? Status,
    CallLogDirection? Direction,
    bool? IsSuccessful,
    DateTime? StartTimeUtc,
    int DurationSeconds,
    string MainLanguage,
    string SummaryTitle,
    string TranscriptSummary,
    string TerminationReason
);

public record GetCallLogResponse(
    string ConversationId,
    Guid AgentId,
    string AgentDisplayName,
    CallLogConversationStatus? Status,
    CallLogDirection? Direction,
    bool? IsSuccessful,
    DateTime? StartTimeUtc,
    int DurationSeconds,
    string MainLanguage,
    string SummaryTitle,
    string TranscriptSummary,
    string TerminationReason,
    bool HasAudio,
    bool HasUserAudio,
    bool HasResponseAudio,
    IReadOnlyList<CallLogTranscriptTurn> Transcript
);

public record CallLogTranscriptTurn(
    string Role,
    string Message,
    string OriginalMessage,
    int? TimeInCallSeconds,
    bool Interrupted,
    string SourceMedium
);

public enum CallLogConversationStatus
{
    Initiated,
    InProgress,
    Processing,
    Done,
    Failed,
}

public enum CallLogDirection
{
    Inbound,
    Outbound,
}
