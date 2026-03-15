namespace Teleagents.Api.Data.Models;

public class UserModel
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }

    public string Email { get; set; } = string.Empty;
    public string WorkOsUserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public TenantModel Tenant { get; set; } = null!;
}
