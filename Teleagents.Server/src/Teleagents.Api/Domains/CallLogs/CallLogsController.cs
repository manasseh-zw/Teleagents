using Microsoft.AspNetCore.Mvc;

namespace Teleagents.Api.Domains.CallLogs;

[ApiController]
[Route("api/call-logs")]
public class CallLogsController : ControllerBase
{
    private readonly ICallLogsService _callLogsService;

    public CallLogsController(ICallLogsService callLogsService)
    {
        _callLogsService = callLogsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCallLogsAsync(
        [FromQuery] GetCallLogsRequest request,
        CancellationToken cancellationToken
    )
    {
        var result = await _callLogsService.GetCallLogsAsync(request, cancellationToken);
        return result.IsFailure ? BadRequest(result.Errors) : Ok(result.Value);
    }

    [HttpGet("{conversationId}")]
    public async Task<IActionResult> GetCallLogAsync(
        [FromRoute] string conversationId,
        CancellationToken cancellationToken
    )
    {
        var result = await _callLogsService.GetCallLogAsync(conversationId, cancellationToken);
        return result.IsFailure ? BadRequest(result.Errors) : Ok(result.Value);
    }
}
