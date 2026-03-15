namespace Teleagents.Api.Data.Models;

public class AgentModel
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }

    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string AssignedPhoneNumber { get; set; } = string.Empty;
    public AgentProvider Provider { get; set; } = AgentProvider.Elevenlabs;
    public string ProviderAgentId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TenantModel Tenant { get; set; } = null!;

    public List<CallLogModel> CallLogs { get; set; } = [];
}

public enum AgentProvider
{
    Elevenlabs,
}
