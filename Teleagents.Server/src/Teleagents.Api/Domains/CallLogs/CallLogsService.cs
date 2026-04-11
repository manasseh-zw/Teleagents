using Microsoft.EntityFrameworkCore;
using Teleagents.Api.Data;
using Teleagents.Api.Data.Models;
using Teleagents.Api.Helpers;
using Teleagents.Providers.Abstractions.Contracts;

namespace Teleagents.Api.Domains.CallLogs;

public interface ICallLogsService
{
    Task<Result<GetCallLogsResponse>> GetCallLogsAsync(
        GetCallLogsRequest request,
        CancellationToken cancellationToken = default
    );

    Task<Result<GetCallLogResponse>> GetCallLogAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    );

    Task<Result<GetCallLogAudioMetadataResponse>> GetCallLogAudioMetadataAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    );

    Task<Result<GetCallLogAudioResponse>> GetCallLogAudioAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    );
}

public class CallLogsService : ICallLogsService
{
    private readonly RepositoryContext _repository;
    private readonly ICurrentTenantService _currentTenantService;
    private readonly IVoiceProviderService _voiceProviderService;

    public CallLogsService(
        RepositoryContext repository,
        ICurrentTenantService currentTenantService,
        IVoiceProviderService voiceProviderService
    )
    {
        _repository = repository;
        _currentTenantService = currentTenantService;
        _voiceProviderService = voiceProviderService;
    }

    public async Task<Result<GetCallLogsResponse>> GetCallLogsAsync(
        GetCallLogsRequest request,
        CancellationToken cancellationToken = default
    )
    {
        if (request.PageSize <= 0)
        {
            return Result<GetCallLogsResponse>.Failure("Page size must be greater than zero");
        }

        var tenantResult = await _currentTenantService.GetCurrentTenantAsync(cancellationToken);
        if (tenantResult.IsFailure)
        {
            return Result<GetCallLogsResponse>.Failure(tenantResult.Errors);
        }

        var tenantId = tenantResult.Value!.Id;

        if (request.AgentId.HasValue)
        {
            var agent = await _repository
                .Agents.AsNoTracking()
                .FirstOrDefaultAsync(
                    model => model.Id == request.AgentId.Value && model.TenantId == tenantId,
                    cancellationToken
                );

            if (agent is null)
            {
                return Result<GetCallLogsResponse>.Failure("Agent not found");
            }

            return await GetSingleAgentCallLogsAsync(agent, request, cancellationToken);
        }

        var agents = await _repository
            .Agents.AsNoTracking()
            .Where(agent => agent.TenantId == tenantId)
            .OrderBy(agent => agent.DisplayName)
            .ToListAsync(cancellationToken);

        if (agents.Count == 0)
        {
            return Result<GetCallLogsResponse>.Success(
                new GetCallLogsResponse([], false, string.Empty)
            );
        }

        var offsetResult = ParseAggregateCursor(request.Cursor);
        if (offsetResult.IsFailure)
        {
            return Result<GetCallLogsResponse>.Failure(offsetResult.Errors);
        }

        var callLogs = new List<GetCallLogListItem>();

        foreach (var agent in agents)
        {
            var conversationsResult = await GetAllCallLogsForAgentAsync(
                agent,
                request,
                cancellationToken
            );

            if (conversationsResult.IsFailure)
            {
                return Result<GetCallLogsResponse>.Failure(conversationsResult.Errors);
            }

            callLogs.AddRange(conversationsResult.Value!);
        }

        var orderedItems = callLogs
            .OrderByDescending(callLog => callLog.StartTimeUtc ?? DateTime.MinValue)
            .ToArray();

        var offset = offsetResult.Value;
        var pagedItems = orderedItems.Skip(offset).Take(request.PageSize).ToArray();
        var hasMore = orderedItems.Length > offset + request.PageSize;
        var nextCursor = hasMore ? (offset + request.PageSize).ToString() : string.Empty;

        return Result<GetCallLogsResponse>.Success(
            new GetCallLogsResponse(pagedItems, hasMore, nextCursor)
        );
    }

    public async Task<Result<GetCallLogResponse>> GetCallLogAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    )
    {
        var contextResult = await GetConversationAccessContextAsync(
            conversationId,
            cancellationToken
        );
        if (contextResult.IsFailure)
        {
            return Result<GetCallLogResponse>.Failure(contextResult.Errors);
        }

        var context = contextResult.Value!;

        return Result<GetCallLogResponse>.Success(
            MapCallLogResponse(context.Agent, context.Conversation)
        );
    }

    public async Task<Result<GetCallLogAudioMetadataResponse>> GetCallLogAudioMetadataAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    )
    {
        var contextResult = await GetConversationAccessContextAsync(
            conversationId,
            cancellationToken
        );
        if (contextResult.IsFailure)
        {
            return Result<GetCallLogAudioMetadataResponse>.Failure(contextResult.Errors);
        }

        var context = contextResult.Value!;

        return Result<GetCallLogAudioMetadataResponse>.Success(
            new GetCallLogAudioMetadataResponse(
                context.Conversation.ConversationId,
                context.Agent.Id,
                context.Agent.DisplayName,
                context.Conversation.HasAudio,
                "audio/mpeg",
                $"{context.Conversation.ConversationId}.mp3"
            )
        );
    }

    public async Task<Result<GetCallLogAudioResponse>> GetCallLogAudioAsync(
        string conversationId,
        CancellationToken cancellationToken = default
    )
    {
        var contextResult = await GetConversationAccessContextAsync(
            conversationId,
            cancellationToken
        );
        if (contextResult.IsFailure)
        {
            return Result<GetCallLogAudioResponse>.Failure(contextResult.Errors);
        }

        var context = contextResult.Value!;

        if (!context.Conversation.HasAudio)
        {
            return Result<GetCallLogAudioResponse>.Failure("Call log audio is not available");
        }

        var providerResult = await _voiceProviderService.GetConversationAudioAsync(
            conversationId,
            cancellationToken
        );

        if (providerResult.IsFailure)
        {
            return Result<GetCallLogAudioResponse>.Failure(providerResult.Errors);
        }

        return Result<GetCallLogAudioResponse>.Success(
            new GetCallLogAudioResponse(
                providerResult.Value!.AudioStream,
                providerResult.Value.ContentType,
                providerResult.Value.FileName
            )
        );
    }

    private async Task<Result<AccessibleConversationContext>> GetConversationAccessContextAsync(
        string conversationId,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return Result<AccessibleConversationContext>.Failure("Conversation ID is required");
        }

        var tenantResult = await _currentTenantService.GetCurrentTenantAsync(cancellationToken);
        if (tenantResult.IsFailure)
        {
            return Result<AccessibleConversationContext>.Failure(tenantResult.Errors);
        }

        var providerResult = await _voiceProviderService.GetConversationAsync(
            conversationId,
            cancellationToken
        );

        if (providerResult.IsFailure)
        {
            return Result<AccessibleConversationContext>.Failure(providerResult.Errors);
        }

        var conversation = providerResult.Value!;

        var agent = await _repository
            .Agents.AsNoTracking()
            .FirstOrDefaultAsync(
                model =>
                    model.TenantId == tenantResult.Value!.Id
                    && model.ProviderAgentId == conversation.ProviderAgentId,
                cancellationToken
            );

        if (agent is null)
        {
            return Result<AccessibleConversationContext>.Failure("Call log not found");
        }

        return Result<AccessibleConversationContext>.Success(
            new AccessibleConversationContext(agent, conversation)
        );
    }

    private async Task<Result<GetCallLogsResponse>> GetSingleAgentCallLogsAsync(
        AgentModel agent,
        GetCallLogsRequest request,
        CancellationToken cancellationToken
    )
    {
        var providerResult = await _voiceProviderService.ListConversationsAsync(
            new VoiceProviderListConversationsRequest(
                ProviderAgentId: agent.ProviderAgentId,
                Cursor: request.Cursor,
                PageSize: request.PageSize,
                StartedAfterUtc: request.StartedAfterUtc,
                StartedBeforeUtc: request.StartedBeforeUtc
            ),
            cancellationToken
        );

        if (providerResult.IsFailure)
        {
            return Result<GetCallLogsResponse>.Failure(providerResult.Errors);
        }

        var items = providerResult
            .Value!.Items.Select(callLog => MapCallLogListItem(agent, callLog))
            .ToArray();

        return Result<GetCallLogsResponse>.Success(
            new GetCallLogsResponse(
                items,
                providerResult.Value.HasMore,
                providerResult.Value.NextCursor
            )
        );
    }

    private async Task<Result<IReadOnlyList<GetCallLogListItem>>> GetAllCallLogsForAgentAsync(
        AgentModel agent,
        GetCallLogsRequest request,
        CancellationToken cancellationToken
    )
    {
        var callLogs = new List<GetCallLogListItem>();
        var cursor = string.Empty;

        do
        {
            var providerResult = await _voiceProviderService.ListConversationsAsync(
                new VoiceProviderListConversationsRequest(
                    ProviderAgentId: agent.ProviderAgentId,
                    Cursor: cursor,
                    PageSize: request.PageSize,
                    StartedAfterUtc: request.StartedAfterUtc,
                    StartedBeforeUtc: request.StartedBeforeUtc
                ),
                cancellationToken
            );

            if (providerResult.IsFailure)
            {
                return Result<IReadOnlyList<GetCallLogListItem>>.Failure(providerResult.Errors);
            }

            callLogs.AddRange(
                providerResult.Value!.Items.Select(callLog => MapCallLogListItem(agent, callLog))
            );

            cursor = providerResult.Value.HasMore ? providerResult.Value.NextCursor : string.Empty;
        } while (!string.IsNullOrWhiteSpace(cursor));

        return Result<IReadOnlyList<GetCallLogListItem>>.Success(callLogs);
    }

    private static Result<int> ParseAggregateCursor(string cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor))
        {
            return Result<int>.Success(0);
        }

        return int.TryParse(cursor, out var offset) && offset >= 0
            ? Result<int>.Success(offset)
            : Result<int>.Failure("Cursor is invalid");
    }

    private static GetCallLogListItem MapCallLogListItem(
        AgentModel agent,
        VoiceProviderConversationListItem callLog
    )
    {
        return new GetCallLogListItem(
            callLog.ConversationId,
            agent.Id,
            agent.DisplayName,
            MapStatus(callLog.Status),
            MapDirection(callLog.Direction),
            callLog.IsSuccessful,
            callLog.StartTimeUtc,
            callLog.DurationSeconds,
            callLog.MainLanguage,
            callLog.SummaryTitle,
            callLog.TranscriptSummary,
            callLog.TerminationReason
        );
    }

    private static GetCallLogResponse MapCallLogResponse(
        AgentModel agent,
        VoiceProviderConversationDetailResponse callLog
    )
    {
        return new GetCallLogResponse(
            callLog.ConversationId,
            agent.Id,
            agent.DisplayName,
            MapStatus(callLog.Status),
            MapDirection(callLog.Direction),
            callLog.IsSuccessful,
            callLog.StartTimeUtc,
            callLog.DurationSeconds,
            callLog.MainLanguage,
            callLog.SummaryTitle,
            callLog.TranscriptSummary,
            callLog.TerminationReason,
            callLog.HasAudio,
            callLog.HasUserAudio,
            callLog.HasResponseAudio,
            callLog
                .Transcript.Select(turn => new CallLogTranscriptTurn(
                    turn.Role,
                    turn.Message,
                    turn.OriginalMessage,
                    turn.TimeInCallSeconds,
                    turn.Interrupted,
                    turn.SourceMedium
                ))
                .ToArray()
        );
    }

    private static CallLogConversationStatus? MapStatus(VoiceProviderConversationStatus? status)
    {
        return status switch
        {
            VoiceProviderConversationStatus.Initiated => CallLogConversationStatus.Initiated,
            VoiceProviderConversationStatus.InProgress => CallLogConversationStatus.InProgress,
            VoiceProviderConversationStatus.Processing => CallLogConversationStatus.Processing,
            VoiceProviderConversationStatus.Done => CallLogConversationStatus.Done,
            VoiceProviderConversationStatus.Failed => CallLogConversationStatus.Failed,
            _ => null,
        };
    }

    private static CallLogDirection? MapDirection(VoiceProviderConversationDirection? direction)
    {
        return direction switch
        {
            VoiceProviderConversationDirection.Inbound => CallLogDirection.Inbound,
            VoiceProviderConversationDirection.Outbound => CallLogDirection.Outbound,
            _ => null,
        };
    }

    private record AccessibleConversationContext(
        AgentModel Agent,
        VoiceProviderConversationDetailResponse Conversation
    );
}
