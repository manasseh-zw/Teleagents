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
    private const int MaxPageSize = 100;
    private const int ScanChunkSize = 50;

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

        var baseQuery = _repository
            .Agents.AsNoTracking()
            .Where(agent => agent.TenantId == tenantResult.Value!.Id);

        if (request.IsActive.HasValue)
        {
            baseQuery = baseQuery.Where(agent => agent.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            var pattern = $"%{search}%";

            baseQuery = baseQuery.Where(agent =>
                EF.Functions.ILike(agent.DisplayName, pattern)
                || EF.Functions.ILike(agent.Description, pattern)
            );
        }

        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, MaxPageSize);
        var cursor = AgentCursor.TryParse(request.Cursor);

        var items = new List<GetAgentListItem>(pageSize);
        AgentCursor? nextCursor = cursor;

        while (items.Count < pageSize)
        {
            var query = ApplyCursor(baseQuery, nextCursor)
                .OrderBy(agent => agent.CreatedAt)
                .ThenBy(agent => agent.Id)
                .Take(ScanChunkSize);

            var chunk = await query.ToListAsync(cancellationToken);
            if (chunk.Count == 0)
            {
                nextCursor = null;
                break;
            }

            var providerResult = await _voiceProviderService.ListAgentsAsync(
                new VoiceProviderListAgentsRequest(
                    ProviderAgentIds: chunk.Select(agent => agent.ProviderAgentId).ToArray(),
                    IncludeArchived: false,
                    PageSize: Math.Max(chunk.Count, 1)
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

            foreach (var agent in chunk)
            {
                if (!providerAgents.TryGetValue(agent.ProviderAgentId, out var providerAgent))
                {
                    continue;
                }

                items.Add(MapAgentListItem(agent, providerAgent));
                if (items.Count >= pageSize)
                {
                    break;
                }
            }

            var last = chunk[^1];
            nextCursor = new AgentCursor(last.CreatedAt, last.Id);

            if (chunk.Count < ScanChunkSize)
            {
                break;
            }
        }

        var hasMoreResult = await HasMoreVisibleAgentsAsync(
            baseQuery,
            nextCursor,
            cancellationToken
        );

        if (hasMoreResult.IsFailure)
        {
            return Result<GetAgentsResponse>.Failure(hasMoreResult.Errors);
        }

        return Result<GetAgentsResponse>.Success(
            new GetAgentsResponse(
                items,
                hasMoreResult.Value!,
                hasMoreResult.Value! && nextCursor is not null ? nextCursor.ToString() : string.Empty
            )
        );
    }

    private static IQueryable<AgentModel> ApplyCursor(
        IQueryable<AgentModel> query,
        AgentCursor? cursor
    )
    {
        if (cursor is null)
        {
            return query;
        }

        return query.Where(agent =>
            agent.CreatedAt > cursor.CreatedAtUtc
            || (agent.CreatedAt == cursor.CreatedAtUtc && agent.Id.CompareTo(cursor.Id) > 0)
        );
    }

    private async Task<Result<bool>> HasMoreVisibleAgentsAsync(
        IQueryable<AgentModel> baseQuery,
        AgentCursor? cursor,
        CancellationToken cancellationToken
    )
    {
        if (cursor is null)
        {
            return Result<bool>.Success(false);
        }

        var scanCursor = cursor;

        for (var i = 0; i < 2; i++)
        {
            var chunk = await ApplyCursor(baseQuery, scanCursor)
                .OrderBy(agent => agent.CreatedAt)
                .ThenBy(agent => agent.Id)
                .Take(ScanChunkSize)
                .ToListAsync(cancellationToken);

            if (chunk.Count == 0)
            {
                return Result<bool>.Success(false);
            }

            var providerResult = await _voiceProviderService.ListAgentsAsync(
                new VoiceProviderListAgentsRequest(
                    ProviderAgentIds: chunk.Select(agent => agent.ProviderAgentId).ToArray(),
                    IncludeArchived: false,
                    PageSize: Math.Max(chunk.Count, 1)
                ),
                cancellationToken
            );

            if (providerResult.IsFailure)
            {
                return Result<bool>.Failure(providerResult.Errors);
            }

            var providerAgents = providerResult.Value!.Items.ToDictionary(
                agent => agent.ProviderAgentId,
                StringComparer.Ordinal
            );

            if (chunk.Any(agent => providerAgents.ContainsKey(agent.ProviderAgentId)))
            {
                return Result<bool>.Success(true);
            }

            var last = chunk[^1];
            scanCursor = new AgentCursor(last.CreatedAt, last.Id);

            if (chunk.Count < ScanChunkSize)
            {
                return Result<bool>.Success(false);
            }
        }

        return Result<bool>.Success(true);
    }

    private sealed record AgentCursor(DateTime CreatedAtUtc, Guid Id)
    {
        public static AgentCursor? TryParse(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return null;
            }

            try
            {
                var decoded = Convert.FromBase64String(input);
                var text = System.Text.Encoding.UTF8.GetString(decoded);
                var parts = text.Split('\n', 2, StringSplitOptions.None);
                if (parts.Length != 2)
                {
                    return null;
                }

                return DateTime.TryParse(
                        parts[0],
                        System.Globalization.CultureInfo.InvariantCulture,
                        System.Globalization.DateTimeStyles.RoundtripKind,
                        out var createdAtUtc
                    )
                    && Guid.TryParse(parts[1], out var id)
                    ? new AgentCursor(createdAtUtc.ToUniversalTime(), id)
                    : null;
            }
            catch
            {
                return null;
            }
        }

        public override string ToString()
        {
            var text = $"{CreatedAtUtc:O}\n{Id:D}";
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(text));
        }
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
