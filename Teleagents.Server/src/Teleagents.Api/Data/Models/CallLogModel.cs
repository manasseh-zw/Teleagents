namespace Teleagents.Api.Data.Models;

public class CallLogModel
{
    public Guid Id { get; set; }

    public Guid AgentId { get; set; }
    public Guid TenantId { get; set; }

    public string ExternalCallId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int DurationInSeconds { get; set; }
    public CallStatus Status { get; set; } = CallStatus.Success;
    public string? RecordingUrl { get; set; }
    public object? Transcript { get; set; }
    public decimal ProviderCost { get; set; }
    public decimal BilledCost { get; set; }

    public AgentModel Agent { get; set; } = null!;
    public TenantModel Tenant { get; set; } = null!;
}

public enum CallStatus
{
    Success,
    Failed,
}
