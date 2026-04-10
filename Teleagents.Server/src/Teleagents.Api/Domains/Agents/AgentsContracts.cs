namespace Teleagents.Api.Domains.Agents;

public record GetAgentsRequest
{
    public string Search { get; init; } = string.Empty;
    public bool? IsActive { get; init; }
}

public record GetAgentsResponse(IReadOnlyList<GetAgentListItem> Items);

public record GetAgentListItem(
    Guid Id,
    string DisplayName,
    string Description,
    string AvatarUrl,
    string AssignedPhoneNumber,
    bool IsActive,
    AgentProviderType Provider,
    string ProviderAgentId,
    DateTime CreatedAtUtc,
    DateTime? ProviderCreatedAtUtc,
    DateTime? LastCallAtUtc
);

public record GetAgentResponse(
    Guid Id,
    string DisplayName,
    string Description,
    string AvatarUrl,
    string AssignedPhoneNumber,
    bool IsActive,
    AgentProviderType Provider,
    string ProviderAgentId,
    string SystemPrompt,
    string FirstMessage,
    string Language,
    IReadOnlyList<AgentPhoneNumberResponse> PhoneNumbers,
    IReadOnlyList<string> KnowledgeBaseIds,
    IReadOnlyList<string> ToolIds,
    DateTime CreatedAtUtc,
    DateTime? ProviderCreatedAtUtc,
    DateTime? ProviderUpdatedAtUtc
);

public record AgentPhoneNumberResponse(string PhoneNumber, string Label, string ProviderType);

public enum AgentProviderType
{
    ElevenLabs,
}
