using Microsoft.Kiota.Abstractions;
using Teleagents.Providers.Abstractions.Contracts;
using Teleagents.Providers.Abstractions.Helpers;
using Teleagents.Providers.ElevenLabs.Generated;
using Teleagents.Providers.ElevenLabs.Generated.Models;
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

        GetAgentResponseModel? agent;

        try
        {
            agent = await _client
                .V1.Convai.Agents[providerAgentId]
                .GetAsync(cancellationToken: cancellationToken);
        }
        catch (ApiException ex) when (IsNotFound(ex))
        {
            return Result<VoiceProviderAgentDetailResponse>.Failure("Voice provider agent not found");
        }

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

        GetConversationResponseModel? conversation;

        try
        {
            conversation = await _client
                .V1.Convai.Conversations[conversationId]
                .GetAsync(cancellationToken: cancellationToken);
        }
        catch (ApiException ex) when (IsNotFound(ex))
        {
            return Result<VoiceProviderConversationDetailResponse>.Failure(
                "Voice provider conversation not found"
            );
        }

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

    public async Task<Result<VoiceProviderConversationAudioMetadataResponse>> GetConversationAudioMetadataAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    )
    {
        var conversationResult = await GetConversationAsync(conversationId, cancellationToken);
        if (conversationResult.IsFailure)
        {
            return Result<VoiceProviderConversationAudioMetadataResponse>.Failure(
                conversationResult.Errors
            );
        }

        var conversation = conversationResult.Value!;

        return Result<VoiceProviderConversationAudioMetadataResponse>.Success(
            new VoiceProviderConversationAudioMetadataResponse(
                conversation.HasAudio,
                "audio/mpeg",
                $"{conversationId}.mp3"
            )
        );
    }

    public async Task<Result<VoiceProviderConversationAudioResponse>> GetConversationAudioAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return Result<VoiceProviderConversationAudioResponse>.Failure(
                "Conversation ID is required"
            );
        }

        Stream? audioStream;

        try
        {
            audioStream = await _client
                .V1.Convai.Conversations[conversationId]
                .Audio.GetAsync(cancellationToken: cancellationToken);
        }
        catch (ApiException ex) when (IsNotFound(ex))
        {
            return Result<VoiceProviderConversationAudioResponse>.Failure(
                "Voice provider conversation audio not found"
            );
        }

        if (audioStream is null)
        {
            return Result<VoiceProviderConversationAudioResponse>.Failure(
                "Voice provider conversation audio not found"
            );
        }

        return Result<VoiceProviderConversationAudioResponse>.Success(
            new VoiceProviderConversationAudioResponse(
                audioStream,
                "audio/mpeg",
                $"{conversationId}.mp3"
            )
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

    private static bool IsNotFound(ApiException exception)
    {
        return exception.ResponseStatusCode == 404;
    }
}
