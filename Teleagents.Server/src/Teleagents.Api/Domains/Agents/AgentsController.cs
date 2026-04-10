using Microsoft.AspNetCore.Mvc;

namespace Teleagents.Api.Domains.Agents;

[ApiController]
[Route("api/agents")]
public class AgentsController : ControllerBase
{
    private readonly IAgentsService _agentsService;

    public AgentsController(IAgentsService agentsService)
    {
        _agentsService = agentsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAgentsAsync(
        [FromQuery] GetAgentsRequest request,
        CancellationToken cancellationToken
    )
    {
        var result = await _agentsService.GetAgentsAsync(request, cancellationToken);
        return result.IsFailure ? BadRequest(result.Errors) : Ok(result.Value);
    }

    [HttpGet("{agentId:guid}")]
    public async Task<IActionResult> GetAgentAsync(
        [FromRoute] Guid agentId,
        CancellationToken cancellationToken
    )
    {
        var result = await _agentsService.GetAgentAsync(agentId, cancellationToken);
        return result.IsFailure ? BadRequest(result.Errors) : Ok(result.Value);
    }
}
