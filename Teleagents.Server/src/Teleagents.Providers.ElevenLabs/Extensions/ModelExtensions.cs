using Teleagents.Providers.Abstractions.Contracts;
using Teleagents.Providers.ElevenLabs.Generated.Models;

namespace Teleagents.Providers.ElevenLabs.Extensions;

internal static class ModelExtensions
{
    public static string AsStringValue(this object? wrapper)
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

    public static int? AsIntegerValue(this object? wrapper)
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

    public static DateTime? ToUtcDateTimeFromUnixSeconds(this int? value)
    {
        return value.HasValue ? DateTimeOffset.FromUnixTimeSeconds(value.Value).UtcDateTime : null;
    }

    public static VoiceProviderConversationDirection? ToVoiceProviderConversationDirection(
        this TelephonyDirection? direction
    )
    {
        return direction switch
        {
            TelephonyDirection.Inbound => VoiceProviderConversationDirection.Inbound,
            TelephonyDirection.Outbound => VoiceProviderConversationDirection.Outbound,
            _ => null,
        };
    }

    public static VoiceProviderConversationStatus? ToVoiceProviderConversationStatus(
        this ConversationSummaryResponseModel_status? status
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

    public static VoiceProviderConversationStatus? ToVoiceProviderConversationStatus(
        this GetConversationResponseModel_status? status
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
}
