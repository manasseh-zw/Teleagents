namespace Teleagents.Api.Data.Models;

public class TenantModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<UserModel> Users { get; set; } = [];
    public List<AgentModel> Agents { get; set; } = [];
}
