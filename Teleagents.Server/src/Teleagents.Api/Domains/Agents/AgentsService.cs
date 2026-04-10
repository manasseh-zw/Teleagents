using Microsoft.EntityFrameworkCore;
using Teleagents.Api.Data;
using Teleagents.Api.Data.Models;
using Teleagents.Api.Helpers;
using Teleagents.Providers.Abstractions.Contracts;

namespace Teleagents.Api.Domains.Agents;

public interface IAgentsService
{
    Task<Result<GetAgentsResponse>> GetAgentsAsync(
        GetAgentsRequest request,
        CancellationToken cancellationToken = default
    );

    Task<Result<GetAgentResponse>> GetAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default
    );
}

public class AgentsService : IAgentsService
{
    private readonly RepositoryContext _repository;
    private readonly ICurrentTenantService _currentTenantService;
    private readonly IVoiceProviderService _voiceProviderService;

    public AgentsService(
        RepositoryContext repository,
        ICurrentTenantService currentTenantService,
        IVoiceProviderService voiceProviderService
    )
    {
        _repository = repository;
        _currentTenantService = currentTenantService;
        _voiceProviderService = voiceProviderService;
    }

    public async Task<Result<GetAgentsResponse>> GetAgentsAsync(
        GetAgentsRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var tenantResult = await _currentTenantService.GetCurrentTenantAsync(cancellationToken);
        if (tenantResult.IsFailure)
        {
            return Result<GetAgentsResponse>.Failure(tenantResult.Errors);
        }

        var query = _repository
            .Agents.AsNoTracking()
            .Where(agent => agent.TenantId == tenantResult.Value!.Id);

        if (request.IsActive.HasValue)
        {
            query = query.Where(agent => agent.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var pattern = $"%{search}%";

            query = query.Where(agent =>
                EF.Functions.ILike(agent.DisplayName, pattern)
                || EF.Functions.ILike(agent.Description, pattern)
            );
        }

        var agents = await query.OrderBy(agent => agent.DisplayName).ToListAsync(cancellationToken);

        if (agents.Count == 0)
        {
            return Result<GetAgentsResponse>.Success(new GetAgentsResponse([]));
        }

        var providerResult = await _voiceProviderService.ListAgentsAsync(
            new VoiceProviderListAgentsRequest(
                ProviderAgentIds: agents.Select(agent => agent.ProviderAgentId).ToArray(),
                PageSize: Math.Max(agents.Count, 1)
            ),
            cancellationToken
        );

        if (providerResult.IsFailure)
        {
            return Result<GetAgentsResponse>.Failure(providerResult.Errors);
        }

        var providerAgents = providerResult.Value!.Items.ToDictionary(
            agent => agent.ProviderAgentId,
            StringComparer.Ordinal
        );

        var items = agents
            .Where(agent => providerAgents.ContainsKey(agent.ProviderAgentId))
            .Select(agent => MapAgentListItem(agent, providerAgents[agent.ProviderAgentId]))
            .ToArray();

        return Result<GetAgentsResponse>.Success(new GetAgentsResponse(items));
    }

    public async Task<Result<GetAgentResponse>> GetAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default
    )
    {
        var tenantResult = await _currentTenantService.GetCurrentTenantAsync(cancellationToken);
        if (tenantResult.IsFailure)
        {
            return Result<GetAgentResponse>.Failure(tenantResult.Errors);
        }

        var agent = await _repository
            .Agents.AsNoTracking()
            .FirstOrDefaultAsync(
                model => model.Id == agentId && model.TenantId == tenantResult.Value!.Id,
                cancellationToken
            );

        if (agent is null)
        {
            return Result<GetAgentResponse>.Failure("Agent not found");
        }

        var providerResult = await _voiceProviderService.GetAgentAsync(
            agent.ProviderAgentId,
            cancellationToken
        );

        if (providerResult.IsFailure)
        {
            return Result<GetAgentResponse>.Failure(providerResult.Errors);
        }

        return Result<GetAgentResponse>.Success(MapAgentResponse(agent, providerResult.Value!));
    }

    private static GetAgentListItem MapAgentListItem(
        AgentModel agent,
        VoiceProviderAgentListItem providerAgent
    )
    {
        return new GetAgentListItem(
            agent.Id,
            agent.DisplayName,
            agent.Description,
            agent.AvatarUrl,
            agent.AssignedPhoneNumber,
            agent.IsActive,
            MapProvider(agent.Provider),
            agent.ProviderAgentId,
            agent.CreatedAt,
            providerAgent.CreatedAtUtc,
            providerAgent.LastCallAtUtc
        );
    }

    private static GetAgentResponse MapAgentResponse(
        AgentModel agent,
        VoiceProviderAgentDetailResponse providerAgent
    )
    {
        return new GetAgentResponse(
            agent.Id,
            agent.DisplayName,
            agent.Description,
            agent.AvatarUrl,
            agent.AssignedPhoneNumber,
            agent.IsActive,
            MapProvider(agent.Provider),
            agent.ProviderAgentId,
            providerAgent.SystemPrompt,
            providerAgent.FirstMessage,
            providerAgent.Language,
            [
                .. providerAgent.PhoneNumbers.Select(phoneNumber => new AgentPhoneNumberResponse(
                    phoneNumber.PhoneNumber,
                    phoneNumber.Label,
                    phoneNumber.ProviderType
                )),
            ],
            providerAgent.KnowledgeBaseIds,
            providerAgent.ToolIds,
            agent.CreatedAt,
            providerAgent.CreatedAtUtc,
            providerAgent.UpdatedAtUtc
        );
    }

    private static AgentProviderType MapProvider(AgentProvider provider)
    {
        return provider switch
        {
            AgentProvider.Elevenlabs => AgentProviderType.ElevenLabs,
            _ => AgentProviderType.ElevenLabs,
        };
    }
}
