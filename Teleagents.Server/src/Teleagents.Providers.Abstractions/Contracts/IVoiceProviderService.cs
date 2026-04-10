using Teleagents.Providers.Abstractions.Helpers;

namespace Teleagents.Providers.Abstractions.Contracts;

public interface IVoiceProviderService
{
    Task<Result<VoiceProviderPagedResponse<VoiceProviderAgentListItem>>> ListAgentsAsync(
        VoiceProviderListAgentsRequest request,
        CancellationToken cancellationToken = default
    );

    Task<Result<VoiceProviderAgentDetailResponse>> GetAgentAsync(
        string providerAgentId,
        CancellationToken cancellationToken = default
    );

    Task<Result<VoiceProviderPagedResponse<VoiceProviderConversationListItem>>>
        ListConversationsAsync(
            VoiceProviderListConversationsRequest request,
            CancellationToken cancellationToken = default
        );

    Task<Result<VoiceProviderConversationDetailResponse>> GetConversationAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    );
}
