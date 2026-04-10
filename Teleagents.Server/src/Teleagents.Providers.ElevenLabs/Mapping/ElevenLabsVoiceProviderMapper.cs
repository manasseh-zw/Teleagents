using System.Text.Json;
using Teleagents.Providers.Abstractions.Contracts;
using Teleagents.Providers.ElevenLabs.Generated.Models;

namespace Teleagents.Providers.ElevenLabs.Mapping;

public static class ElevenLabsVoiceProviderMapper
{
    public static VoiceProviderAgentListItem MapAgentListItem(AgentSummaryResponseModel agent)
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

    public static VoiceProviderAgentDetailResponse MapAgentDetail(GetAgentResponseModel agent)
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

    public static VoiceProviderConversationListItem MapConversationListItem(
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

    public static VoiceProviderConversationDetailResponse MapConversationDetail(
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

    public static string GetNextCursorValue(object? wrapper)
    {
        return GetStringValue(wrapper);
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
