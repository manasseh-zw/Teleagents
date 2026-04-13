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
    private const int MaxAgentsPageSize = 100;

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
        if (request.ProviderAgentIds is { Count: > 0 })
        {
            // ElevenLabs list endpoint does not support filtering by agent IDs.
            // If the caller provides IDs, we page through the list and filter client-side
            // until all requested IDs are found or we reach the end.
            var wanted = request.ProviderAgentIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.Ordinal);

            var found = new Dictionary<string, VoiceProviderAgentListItem>(StringComparer.Ordinal);
            var cursor = request.Cursor;

            while (wanted.Count > 0)
            {
                var response = await _client.V1.Convai.Agents.GetAsync(
                    config =>
                    {
                        config.QueryParameters.Archived = request.IncludeArchived ? null : false;
                        config.QueryParameters.PageSize = MaxAgentsPageSize;
                        config.QueryParameters.Cursor = NullIfEmpty(cursor);
                        config.QueryParameters.Search = NullIfEmpty(request.Search);
                    },
                    cancellationToken
                );

                var agents = response?.Agents ?? [];
                foreach (var agent in agents)
                {
                    var agentId = agent?.AgentId;
                    if (string.IsNullOrWhiteSpace(agentId) || !wanted.Contains(agentId))
                    {
                        continue;
                    }

                    found[agentId] = ElevenLabsVoiceProviderMapper.MapAgentListItem(agent);
                    wanted.Remove(agentId);
                }

                if (wanted.Count == 0)
                {
                    break;
                }

                if (response?.HasMore != true)
                {
                    break;
                }

                cursor = ElevenLabsVoiceProviderMapper.GetNextCursorValue(response?.NextCursor);
                if (string.IsNullOrWhiteSpace(cursor))
                {
                    break;
                }
            }

            return Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>.Success(
                new VoiceProviderPagedResponse<VoiceProviderAgentListItem>(
                    found.Values.ToArray(),
                    false,
                    ""
                )
            );
        }

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
                    ?.Agents?.Select(ElevenLabsVoiceProviderMapper.MapAgentListItem)
                    .ToArray() ?? [];

            return Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>.Success(
                new VoiceProviderPagedResponse<VoiceProviderAgentListItem>(
                    items,
                    response?.HasMore ?? false,
                    ElevenLabsVoiceProviderMapper.GetNextCursorValue(response?.NextCursor)
                )
            );
        }
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
