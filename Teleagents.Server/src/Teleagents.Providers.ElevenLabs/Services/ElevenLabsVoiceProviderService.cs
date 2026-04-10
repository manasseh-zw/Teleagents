using System.Text.Json;
using Microsoft.Extensions.Logging;
using Teleagents.Providers.Abstractions.Contracts;
using Teleagents.Providers.Abstractions.Helpers;
using Teleagents.Providers.ElevenLabs.Generated;
using Teleagents.Providers.ElevenLabs.Generated.Models;

namespace Teleagents.Providers.ElevenLabs.Services;

public class ElevenLabsVoiceProviderService : IVoiceProviderService
{
    private readonly ElevenLabsApiClient _client;
    private readonly ILogger<ElevenLabsVoiceProviderService> _logger;

    public ElevenLabsVoiceProviderService(
        ElevenLabsApiClient client,
        ILogger<ElevenLabsVoiceProviderService> logger
    )
    {
        _client = client;
        _logger = logger;
    }

    public async Task<
        Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>
    > ListAgentsAsync(
        VoiceProviderListAgentsRequest request,
        CancellationToken cancellationToken = default
    )
    {
        try
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
                    .Select(MapAgentListItem)
                    .ToArray() ?? [];

            return Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>.Success(
                new VoiceProviderPagedResponse<VoiceProviderAgentListItem>(
                    items,
                    response?.HasMore ?? false,
                    GetStringValue(response?.NextCursor)
                )
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list ElevenLabs agents");
            return Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>.Failure(
                "Failed to list voice provider agents"
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

        try
        {
            var agent = await _client
                .V1.Convai.Agents[providerAgentId]
                .GetAsync(cancellationToken: cancellationToken);

            if (agent is null || string.IsNullOrWhiteSpace(agent.AgentId))
            {
                return Result<VoiceProviderAgentDetailResponse>.Failure(
                    "Voice provider agent not found"
                );
            }

            return Result<VoiceProviderAgentDetailResponse>.Success(MapAgentDetail(agent));
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to get ElevenLabs agent {ProviderAgentId}",
                providerAgentId
            );
            return Result<VoiceProviderAgentDetailResponse>.Failure(
                "Failed to retrieve voice provider agent"
            );
        }
    }

    public async Task<
        Result<VoiceProviderPagedResponse<VoiceProviderConversationListItem>>
    > ListConversationsAsync(
        VoiceProviderListConversationsRequest request,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var response = await _client.V1.Convai.Conversations.GetAsync(
                config =>
                {
                    config.QueryParameters.AgentId = NullIfEmpty(request.ProviderAgentId);
                    config.QueryParameters.BranchId = NullIfEmpty(request.BranchId);
                    config.QueryParameters.Cursor = NullIfEmpty(request.Cursor);
                    config.QueryParameters.PageSize = request.PageSize;
                    config.QueryParameters.CallStartAfterUnix = ToUnixSeconds(
                        request.StartedAfterUtc
                    );
                    config.QueryParameters.CallStartBeforeUnix = ToUnixSeconds(
                        request.StartedBeforeUtc
                    );
                    config.QueryParameters.CallDurationMinSecs = request.MinDurationSeconds;
                    config.QueryParameters.CallDurationMaxSecs = request.MaxDurationSeconds;
                    config.QueryParameters.CallSuccessful = request
                        .Success?.ToString()
                        .ToLowerInvariant();
                    config.QueryParameters.SummaryMode = request.IncludeSummaries
                        ? Generated
                            .V1
                            .Convai
                            .Conversations
                            .GetSummary_modeQueryParameterType
                            .Include
                        : Generated
                            .V1
                            .Convai
                            .Conversations
                            .GetSummary_modeQueryParameterType
                            .Exclude;
                },
                cancellationToken
            );

            var items = response?.Conversations?.Select(MapConversationListItem).ToArray() ?? [];

            return Result<VoiceProviderPagedResponse<VoiceProviderConversationListItem>>.Success(
                new VoiceProviderPagedResponse<VoiceProviderConversationListItem>(
                    items,
                    response?.HasMore ?? false,
                    GetStringValue(response?.NextCursor)
                )
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list ElevenLabs conversations");
            return Result<VoiceProviderPagedResponse<VoiceProviderConversationListItem>>.Failure(
                "Failed to list voice provider conversations"
            );
        }
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

        try
        {
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
                MapConversationDetail(conversation)
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to get ElevenLabs conversation {ConversationId}",
                conversationId
            );
            return Result<VoiceProviderConversationDetailResponse>.Failure(
                "Failed to retrieve voice provider conversation"
            );
        }
    }

    private static VoiceProviderAgentListItem MapAgentListItem(AgentSummaryResponseModel agent)
    {
        return new VoiceProviderAgentListItem(
            agent.AgentId ?? string.Empty,
            agent.Name ?? string.Empty,
            agent.Archived ?? false,
            agent.Tags ?? [],
            FromUnixSeconds(agent.CreatedAtUnixSecs),
            FromUnixSeconds(GetIntegerValue(agent.LastCallTimeUnixSecs))
        );
    }

    private static VoiceProviderAgentDetailResponse MapAgentDetail(GetAgentResponseModel agent)
    {
        var config = agent.ConversationConfig?.Agent;
        var prompt = config?.Prompt;

        return new VoiceProviderAgentDetailResponse(
            agent.AgentId ?? string.Empty,
            agent.Name ?? string.Empty,
            agent.Tags ?? [],
            FromUnixSeconds(agent.Metadata?.CreatedAtUnixSecs),
            FromUnixSeconds(agent.Metadata?.UpdatedAtUnixSecs),
            GetStringValue(agent.BranchId),
            GetStringValue(agent.MainBranchId),
            GetStringValue(agent.VersionId),
            prompt?.Prompt ?? string.Empty,
            config?.FirstMessage ?? string.Empty,
            config?.Language ?? string.Empty,
            MapPhoneNumbers(agent.PhoneNumbers),
            prompt
                ?.KnowledgeBase?.Select(kb => kb.Id ?? string.Empty)
                .Where(id => id.Length > 0)
                .ToArray() ?? [],
            prompt?.ToolIds?.Where(id => !string.IsNullOrWhiteSpace(id)).ToArray() ?? []
        );
    }

    private static IReadOnlyList<VoiceProviderPhoneNumber> MapPhoneNumbers(
        List<GetAgentResponseModel.GetAgentResponseModel_phone_numbers>? phoneNumbers
    )
    {
        if (phoneNumbers is null || phoneNumbers.Count == 0)
        {
            return [];
        }

        return phoneNumbers
            .Select(phoneNumber =>
            {
                if (phoneNumber.GetPhoneNumberTwilioResponseModel is not null)
                {
                    return new VoiceProviderPhoneNumber(
                        phoneNumber.GetPhoneNumberTwilioResponseModel.PhoneNumber ?? string.Empty,
                        phoneNumber.GetPhoneNumberTwilioResponseModel.Label ?? string.Empty,
                        phoneNumber.GetPhoneNumberTwilioResponseModel.Provider ?? string.Empty
                    );
                }

                if (phoneNumber.GetPhoneNumberSIPTrunkResponseModel is not null)
                {
                    return new VoiceProviderPhoneNumber(
                        phoneNumber.GetPhoneNumberSIPTrunkResponseModel.PhoneNumber ?? string.Empty,
                        phoneNumber.GetPhoneNumberSIPTrunkResponseModel.Label ?? string.Empty,
                        phoneNumber.GetPhoneNumberSIPTrunkResponseModel.Provider ?? string.Empty
                    );
                }

                return new VoiceProviderPhoneNumber(string.Empty, string.Empty, string.Empty);
            })
            .Where(phoneNumber => !string.IsNullOrWhiteSpace(phoneNumber.PhoneNumber))
            .ToArray();
    }

    private static VoiceProviderConversationListItem MapConversationListItem(
        ConversationSummaryResponseModel conversation
    )
    {
        return new VoiceProviderConversationListItem(
            conversation.ConversationId ?? string.Empty,
            conversation.AgentId ?? string.Empty,
            GetStringValue(conversation.AgentName),
            GetStringValue(conversation.BranchId),
            FromUnixSeconds(conversation.StartTimeUnixSecs),
            conversation.CallDurationSecs ?? 0,
            MapConversationStatus(conversation.Status),
            MapConversationDirection(conversation.Direction),
            conversation.CallSuccessful switch
            {
                EvaluationSuccessResult.Success => true,
                EvaluationSuccessResult.Failure => false,
                _ => null,
            },
            conversation.MessageCount ?? 0,
            GetStringValue(conversation.MainLanguage),
            GetStringValue(conversation.CallSummaryTitle),
            GetStringValue(conversation.TranscriptSummary),
            conversation.TerminationReason ?? string.Empty
        );
    }

    private static VoiceProviderConversationDetailResponse MapConversationDetail(
        GetConversationResponseModel conversation
    )
    {
        var transcript = conversation.Transcript?.Select(MapTranscriptTurn).ToArray() ?? [];
        var startTimeUtc = FromUnixSeconds(conversation.Metadata?.StartTimeUnixSecs);
        var durationSeconds = conversation.Metadata?.CallDurationSecs ?? 0;
        var mainLanguage = GetStringValue(conversation.Metadata?.MainLanguage);
        var terminationReason = GetStringValue(conversation.Metadata?.TerminationReason);

        return new VoiceProviderConversationDetailResponse(
            conversation.ConversationId ?? string.Empty,
            conversation.AgentId ?? string.Empty,
            GetStringValue(conversation.AgentName),
            GetStringValue(conversation.BranchId),
            startTimeUtc,
            durationSeconds,
            MapConversationStatus(conversation.Status),
            null,
            null,
            transcript.Length,
            mainLanguage,
            GetStringValue(conversation.Analysis?.CallSummaryTitle),
            GetStringValue(conversation.Analysis?.TranscriptSummary),
            terminationReason,
            conversation.HasAudio ?? false,
            conversation.HasUserAudio ?? false,
            conversation.HasResponseAudio ?? false,
            conversation.Environment ?? string.Empty,
            GetStringValue(conversation.VersionId),
            GetStringValue(conversation.UserId),
            transcript,
            JsonSerializer.Serialize(conversation.Transcript ?? [])
        );
    }

    private static VoiceProviderTranscriptTurn MapTranscriptTurn(
        ConversationHistoryTranscriptResponseModel turn
    )
    {
        return new VoiceProviderTranscriptTurn(
            turn.Role?.ToString() ?? string.Empty,
            GetStringValue(turn.Message),
            GetStringValue(turn.OriginalMessage),
            turn.TimeInCallSecs,
            turn.Interrupted ?? false,
            turn.SourceMedium?.ToString() ?? string.Empty
        );
    }

    private static DateTime? FromUnixSeconds(int? value)
    {
        return value.HasValue ? DateTimeOffset.FromUnixTimeSeconds(value.Value).UtcDateTime : null;
    }

    private static int? ToUnixSeconds(DateTime? value)
    {
        return value.HasValue ? (int)new DateTimeOffset(value.Value).ToUnixTimeSeconds() : null;
    }

    private static string? NullIfEmpty(string value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static VoiceProviderConversationDirection? MapConversationDirection(
        TelephonyDirection? direction
    )
    {
        return direction switch
        {
            TelephonyDirection.Inbound => VoiceProviderConversationDirection.Inbound,
            TelephonyDirection.Outbound => VoiceProviderConversationDirection.Outbound,
            _ => null,
        };
    }

    private static VoiceProviderConversationStatus? MapConversationStatus(
        ConversationSummaryResponseModel_status? status
    )
    {
        return status switch
        {
            ConversationSummaryResponseModel_status.Initiated =>
                VoiceProviderConversationStatus.Initiated,
            ConversationSummaryResponseModel_status.InProgress =>
                VoiceProviderConversationStatus.InProgress,
            ConversationSummaryResponseModel_status.Processing =>
                VoiceProviderConversationStatus.Processing,
            ConversationSummaryResponseModel_status.Done => VoiceProviderConversationStatus.Done,
            ConversationSummaryResponseModel_status.Failed =>
                VoiceProviderConversationStatus.Failed,
            _ => null,
        };
    }

    private static VoiceProviderConversationStatus? MapConversationStatus(
        GetConversationResponseModel_status? status
    )
    {
        return status switch
        {
            GetConversationResponseModel_status.Initiated =>
                VoiceProviderConversationStatus.Initiated,
            GetConversationResponseModel_status.InProgress =>
                VoiceProviderConversationStatus.InProgress,
            GetConversationResponseModel_status.Processing =>
                VoiceProviderConversationStatus.Processing,
            GetConversationResponseModel_status.Done => VoiceProviderConversationStatus.Done,
            GetConversationResponseModel_status.Failed => VoiceProviderConversationStatus.Failed,
            _ => null,
        };
    }

    private static string GetStringValue(object? wrapper)
    {
        if (wrapper is null)
        {
            return string.Empty;
        }

        if (wrapper is string value)
        {
            return value;
        }

        return wrapper.GetType().GetProperty("String")?.GetValue(wrapper) as string ?? string.Empty;
    }

    private static int? GetIntegerValue(object? wrapper)
    {
        if (wrapper is null)
        {
            return null;
        }

        if (wrapper is int value)
        {
            return value;
        }

        return wrapper.GetType().GetProperty("Integer")?.GetValue(wrapper) as int?;
    }
}
