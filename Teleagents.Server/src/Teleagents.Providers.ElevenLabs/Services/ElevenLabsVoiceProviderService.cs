using System.Text.Json;
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
    private readonly HttpClient _httpClient;
    private const int MaxAgentsPageSize = 100;
    private const int MaxAgentSummaryBatchSize = 100;

    public ElevenLabsVoiceProviderService(
        ElevenLabsApiClient client,
        IHttpClientFactory httpClientFactory
    )
    {
        _client = client;
        _httpClient = httpClientFactory.CreateClient("ElevenLabs");
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
            var summariesResult = await GetAgentSummariesByIdAsync(
                request.ProviderAgentIds,
                request.IncludeArchived,
                cancellationToken
            );

            if (summariesResult.IsFailure)
            {
                return Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>.Failure(
                    summariesResult.Errors
                );
            }

            var orderedItems = request.ProviderAgentIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.Ordinal)
                .Select(id =>
                    summariesResult.Value!.TryGetValue(id, out var agentSummary) ? agentSummary : null
                )
                .Where(agentSummary => agentSummary is not null)
                .Select(agentSummary => agentSummary!)
                .ToArray();

            return Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>.Success(
                new VoiceProviderPagedResponse<VoiceProviderAgentListItem>(
                    orderedItems,
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

    private async Task<Result<IReadOnlyDictionary<string, VoiceProviderAgentListItem>>> GetAgentSummariesByIdAsync(
        IReadOnlyList<string> providerAgentIds,
        bool includeArchived,
        CancellationToken cancellationToken
    )
    {
        var normalizedAgentIds = providerAgentIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (normalizedAgentIds.Length == 0)
        {
            return Result<IReadOnlyDictionary<string, VoiceProviderAgentListItem>>.Success(
                new Dictionary<string, VoiceProviderAgentListItem>(StringComparer.Ordinal)
            );
        }

        var summaries = new Dictionary<string, VoiceProviderAgentListItem>(StringComparer.Ordinal);

        foreach (var batch in normalizedAgentIds.Chunk(MaxAgentSummaryBatchSize))
        {
            using var response = await _httpClient.GetAsync(
                BuildAgentSummariesPath(batch),
                cancellationToken
            );

            if (!response.IsSuccessStatusCode)
            {
                return Result<IReadOnlyDictionary<string, VoiceProviderAgentListItem>>.Failure(
                    $"Failed to fetch agent summaries from ElevenLabs ({(int)response.StatusCode})."
                );
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return Result<IReadOnlyDictionary<string, VoiceProviderAgentListItem>>.Failure(
                    "ElevenLabs returned an invalid agent summaries payload."
                );
            }

            foreach (var property in document.RootElement.EnumerateObject())
            {
                if (!TryMapAgentSummary(property.Value, out var summary))
                {
                    continue;
                }

                if (!includeArchived && summary.IsArchived)
                {
                    continue;
                }

                summaries[property.Name] = summary;
            }
        }

        return Result<IReadOnlyDictionary<string, VoiceProviderAgentListItem>>.Success(summaries);
    }

    private static string BuildAgentSummariesPath(IEnumerable<string> providerAgentIds)
    {
        var query = string.Join(
            "&",
            providerAgentIds.Select(id => $"agent_ids={Uri.EscapeDataString(id)}")
        );

        return $"/v1/convai/agents/summaries?{query}";
    }

    private static bool TryMapAgentSummary(
        JsonElement responseElement,
        out VoiceProviderAgentListItem summary
    )
    {
        summary = default!;

        if (
            responseElement.ValueKind != JsonValueKind.Object
            || !responseElement.TryGetProperty("status", out var statusElement)
            || !string.Equals(statusElement.GetString(), "success", StringComparison.OrdinalIgnoreCase)
            || !responseElement.TryGetProperty("data", out var dataElement)
            || dataElement.ValueKind != JsonValueKind.Object
        )
        {
            return false;
        }

        var model = new AgentSummaryResponseModel
        {
            AgentId = GetString(dataElement, "agent_id"),
            Name = GetString(dataElement, "name"),
            Archived = GetNullableBoolean(dataElement, "archived"),
            CreatedAtUnixSecs = GetNullableInt32(dataElement, "created_at_unix_secs"),
            Tags = GetStringArray(dataElement, "tags"),
            LastCallTimeUnixSecs = GetNullableInt32Wrapper(dataElement, "last_call_time_unix_secs"),
        };

        summary = ElevenLabsVoiceProviderMapper.MapAgentListItem(model);
        return !string.IsNullOrWhiteSpace(summary.ProviderAgentId);
    }

    private static string GetString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString() ?? string.Empty
            : string.Empty;
    }

    private static bool? GetNullableBoolean(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            _ => null,
        };
    }

    private static int? GetNullableInt32(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property)
            && property.ValueKind == JsonValueKind.Number
            && property.TryGetInt32(out var value)
            ? value
            : null;
    }

    private static List<string>? GetStringArray(JsonElement element, string propertyName)
    {
        if (
            !element.TryGetProperty(propertyName, out var property)
            || property.ValueKind != JsonValueKind.Array
        )
        {
            return null;
        }

        return
        [
            .. property
                .EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item!),
        ];
    }

    private static AgentSummaryResponseModel.AgentSummaryResponseModel_last_call_time_unix_secs? GetNullableInt32Wrapper(
        JsonElement element,
        string propertyName
    )
    {
        var value = GetNullableInt32(element, propertyName);
        return value.HasValue
            ? new AgentSummaryResponseModel.AgentSummaryResponseModel_last_call_time_unix_secs
            {
                Integer = value.Value,
            }
            : null;
    }
}
