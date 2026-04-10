using Teleagents.Providers.Abstractions.Contracts;
using Teleagents.Providers.Abstractions.Helpers;
using Teleagents.Providers.ElevenLabs.Generated;
using Teleagents.Providers.ElevenLabs.Mapping;

namespace Teleagents.Providers.ElevenLabs.Services;

public class ElevenLabsVoiceProviderService : IVoiceProviderService
{
    private readonly ElevenLabsApiClient _client;

    public ElevenLabsVoiceProviderService(ElevenLabsApiClient client)
    {
        _client = client;
    }

    public async Task<
        Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>
    > ListAgentsAsync(
        VoiceProviderListAgentsRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _client.V1.Convai.Agents.GetAsync(
            config =>
            {
                config.QueryParameters.Archived = request.IncludeArchived ? null : false;
                config.QueryParameters.PageSize = request.PageSize;
                config.QueryParameters.Cursor = NullIfEmpty(request.Cursor);
                config.QueryParameters.Search = NullIfEmpty(request.Search);
            },
            cancellationToken
        );

        var items =
            response
                ?.Agents?.Where(agent =>
                    request.ProviderAgentIds is null
                    || request.ProviderAgentIds.Count == 0
                    || (
                        !string.IsNullOrWhiteSpace(agent.AgentId)
                        && request.ProviderAgentIds.Contains(agent.AgentId)
                    )
                )
                .Select(ElevenLabsVoiceProviderMapper.MapAgentListItem)
                .ToArray() ?? [];

        return Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>.Success(
            new VoiceProviderPagedResponse<VoiceProviderAgentListItem>(
                items,
                response?.HasMore ?? false,
                ElevenLabsVoiceProviderMapper.GetNextCursorValue(response?.NextCursor)
            )
        );
    }

    public async Task<Result<VoiceProviderAgentDetailResponse>> GetAgentAsync(
        string providerAgentId,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(providerAgentId))
        {
            return Result<VoiceProviderAgentDetailResponse>.Failure(
                "Provider agent ID is required"
            );
        }

        var agent = await _client
            .V1.Convai.Agents[providerAgentId]
            .GetAsync(cancellationToken: cancellationToken);

        if (agent is null || string.IsNullOrWhiteSpace(agent.AgentId))
        {
            return Result<VoiceProviderAgentDetailResponse>.Failure(
                "Voice provider agent not found"
            );
        }

        return Result<VoiceProviderAgentDetailResponse>.Success(
            ElevenLabsVoiceProviderMapper.MapAgentDetail(agent)
        );
    }

    public async Task<
        Result<VoiceProviderPagedResponse<VoiceProviderConversationListItem>>
    > ListConversationsAsync(
        VoiceProviderListConversationsRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _client.V1.Convai.Conversations.GetAsync(
            config =>
            {
                config.QueryParameters.AgentId = NullIfEmpty(request.ProviderAgentId);
                config.QueryParameters.BranchId = NullIfEmpty(request.BranchId);
                config.QueryParameters.Cursor = NullIfEmpty(request.Cursor);
                config.QueryParameters.PageSize = request.PageSize;
                config.QueryParameters.CallStartAfterUnix = ToUnixSeconds(request.StartedAfterUtc);
                config.QueryParameters.CallStartBeforeUnix = ToUnixSeconds(
                    request.StartedBeforeUtc
                );
                config.QueryParameters.CallDurationMinSecs = request.MinDurationSeconds;
                config.QueryParameters.CallDurationMaxSecs = request.MaxDurationSeconds;
                config.QueryParameters.CallSuccessful = request
                    .Success?.ToString()
                    .ToLowerInvariant();
                config.QueryParameters.SummaryMode = request.IncludeSummaries
                    ? Generated.V1.Convai.Conversations.GetSummary_modeQueryParameterType.Include
                    : Generated.V1.Convai.Conversations.GetSummary_modeQueryParameterType.Exclude;
            },
            cancellationToken
        );

        var items =
            response
                ?.Conversations?.Select(ElevenLabsVoiceProviderMapper.MapConversationListItem)
                .ToArray() ?? [];

        return Result<VoiceProviderPagedResponse<VoiceProviderConversationListItem>>.Success(
            new VoiceProviderPagedResponse<VoiceProviderConversationListItem>(
                items,
                response?.HasMore ?? false,
                ElevenLabsVoiceProviderMapper.GetNextCursorValue(response?.NextCursor)
            )
        );
    }

    public async Task<Result<VoiceProviderConversationDetailResponse>> GetConversationAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return Result<VoiceProviderConversationDetailResponse>.Failure(
                "Conversation ID is required"
            );
        }

        var conversation = await _client
            .V1.Convai.Conversations[conversationId]
            .GetAsync(cancellationToken: cancellationToken);

        if (conversation is null || string.IsNullOrWhiteSpace(conversation.ConversationId))
        {
            return Result<VoiceProviderConversationDetailResponse>.Failure(
                "Voice provider conversation not found"
            );
        }

        return Result<VoiceProviderConversationDetailResponse>.Success(
            ElevenLabsVoiceProviderMapper.MapConversationDetail(conversation)
        );
    }

    private static int? ToUnixSeconds(DateTime? value)
    {
        return value.HasValue ? (int)new DateTimeOffset(value.Value).ToUnixTimeSeconds() : null;
    }

    private static string? NullIfEmpty(string value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }
}
