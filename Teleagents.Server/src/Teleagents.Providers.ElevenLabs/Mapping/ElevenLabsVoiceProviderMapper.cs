using System.Text.Json;
using Teleagents.Providers.Abstractions.Contracts;
using Teleagents.Providers.ElevenLabs.Extensions;
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
            agent.CreatedAtUnixSecs.ToUtcDateTimeFromUnixSeconds(),
            agent.LastCallTimeUnixSecs.AsIntegerValue().ToUtcDateTimeFromUnixSeconds()
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
            agent.Metadata?.CreatedAtUnixSecs.ToUtcDateTimeFromUnixSeconds(),
            agent.Metadata?.UpdatedAtUnixSecs.ToUtcDateTimeFromUnixSeconds(),
            agent.BranchId.AsStringValue(),
            agent.MainBranchId.AsStringValue(),
            agent.VersionId.AsStringValue(),
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
            conversation.AgentName.AsStringValue(),
            conversation.BranchId.AsStringValue(),
            conversation.StartTimeUnixSecs.ToUtcDateTimeFromUnixSeconds(),
            conversation.CallDurationSecs ?? 0,
            conversation.Status.ToVoiceProviderConversationStatus(),
            conversation.Direction.ToVoiceProviderConversationDirection(),
            conversation.CallSuccessful switch
            {
                EvaluationSuccessResult.Success => true,
                EvaluationSuccessResult.Failure => false,
                _ => null,
            },
            conversation.MessageCount ?? 0,
            conversation.MainLanguage.AsStringValue(),
            conversation.CallSummaryTitle.AsStringValue(),
            conversation.TranscriptSummary.AsStringValue(),
            conversation.TerminationReason ?? string.Empty
        );
    }

    public static VoiceProviderConversationDetailResponse MapConversationDetail(
        GetConversationResponseModel conversation
    )
    {
        var transcript = conversation.Transcript?.Select(MapTranscriptTurn).ToArray() ?? [];
        var startTimeUtc = conversation.Metadata?.StartTimeUnixSecs.ToUtcDateTimeFromUnixSeconds();
        var durationSeconds = conversation.Metadata?.CallDurationSecs ?? 0;
        var mainLanguage = conversation.Metadata?.MainLanguage.AsStringValue();
        var terminationReason = conversation.Metadata?.TerminationReason.AsStringValue();

        return new VoiceProviderConversationDetailResponse(
            conversation.ConversationId ?? string.Empty,
            conversation.AgentId ?? string.Empty,
            conversation.AgentName.AsStringValue(),
            conversation.BranchId.AsStringValue(),
            startTimeUtc,
            durationSeconds,
            conversation.Status.ToVoiceProviderConversationStatus(),
            null,
            null,
            transcript.Length,
            mainLanguage,
            conversation.Analysis?.CallSummaryTitle.AsStringValue(),
            conversation.Analysis?.TranscriptSummary.AsStringValue(),
            terminationReason,
            conversation.HasAudio ?? false,
            conversation.HasUserAudio ?? false,
            conversation.HasResponseAudio ?? false,
            conversation.Environment ?? string.Empty,
            conversation.VersionId.AsStringValue(),
            conversation.UserId.AsStringValue(),
            transcript,
            JsonSerializer.Serialize(conversation.Transcript ?? [])
        );
    }

    public static string GetNextCursorValue(object? wrapper)
    {
        return wrapper.AsStringValue();
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
            turn.Message.AsStringValue(),
            turn.OriginalMessage.AsStringValue(),
            turn.TimeInCallSecs,
            turn.Interrupted ?? false,
            turn.SourceMedium?.ToString() ?? string.Empty
        );
    }
}
