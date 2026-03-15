using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Teleagents.Api.Helpers;
using Teleagents.Api.Data.Models;

namespace Teleagents.Api.Data;

public class RepositoryContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public RepositoryContext(
        DbContextOptions<RepositoryContext> options,
        ITenantContext tenantContext
    )
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<TenantModel> Tenants => Set<TenantModel>();
    public DbSet<UserModel> Users => Set<UserModel>();
    public DbSet<AgentModel> Agents => Set<AgentModel>();
    public DbSet<CallLogModel> CallLogs => Set<CallLogModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureTenant(modelBuilder);
        ConfigureUser(modelBuilder);
        ConfigureAgent(modelBuilder);
        ConfigureCallLog(modelBuilder);

        ApplyGlobalTenantFilters(modelBuilder);
    }

    private void ApplyGlobalTenantFilters(ModelBuilder modelBuilder)
    {
        modelBuilder
            .Entity<UserModel>()
            .HasQueryFilter(
                u =>
                    _tenantContext.TenantId == null
                    || u.TenantId == _tenantContext.TenantId
            );

        modelBuilder
            .Entity<AgentModel>()
            .HasQueryFilter(
                a =>
                    _tenantContext.TenantId == null
                    || a.TenantId == _tenantContext.TenantId
            );

        modelBuilder
            .Entity<CallLogModel>()
            .HasQueryFilter(
                c =>
                    _tenantContext.TenantId == null
                    || c.TenantId == _tenantContext.TenantId
            );
    }

    private static void ConfigureTenant(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<TenantModel>();
        entity.ToTable("tenants");
        entity.HasKey(t => t.Id);
        entity.Property(t => t.Name).IsRequired().HasMaxLength(200);
        entity.Property(t => t.Domain).IsRequired().HasMaxLength(255);
        entity.Property(t => t.LogoUrl).HasMaxLength(1024);
        entity.HasIndex(t => t.Domain).IsUnique();
        entity
            .HasMany(t => t.Users)
            .WithOne(u => u.Tenant)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        entity
            .HasMany(t => t.Agents)
            .WithOne(a => a.Tenant)
            .HasForeignKey(a => a.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<UserModel>();

        entity.ToTable("users");
        entity.HasKey(u => u.Id);
        entity.Property(u => u.Email).IsRequired().HasMaxLength(320);
        entity.Property(u => u.WorkOsUserId).IsRequired().HasMaxLength(200);
        entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
        entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
        entity.HasIndex(u => new { u.TenantId, u.Email }).IsUnique();
        entity.HasIndex(u => u.WorkOsUserId);
    }

    private static void ConfigureAgent(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<AgentModel>();

        entity.ToTable("agents");
        entity.HasKey(a => a.Id);
        entity.Property(a => a.DisplayName).IsRequired().HasMaxLength(200);
        entity.Property(a => a.Description).HasMaxLength(200);
        entity.Property(a => a.AvatarUrl).HasMaxLength(1024);
        entity.Property(a => a.AssignedPhoneNumber).HasMaxLength(50);
        entity.Property(a => a.ProviderAgentId).IsRequired().HasMaxLength(200);
        entity.HasIndex(a => a.TenantId);
        entity.HasIndex(a => a.AssignedPhoneNumber).IsUnique();
        entity
            .HasIndex(a => new
            {
                a.TenantId,
                a.Provider,
                a.ProviderAgentId,
            })
            .IsUnique();
    }

    private static void ConfigureCallLog(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CallLogModel>();

        entity.ToTable("call_logs");
        entity.HasKey(c => c.Id);
        entity.Property(c => c.ExternalCallId).IsRequired().HasMaxLength(200);
        entity.Property(c => c.RecordingUrl).HasMaxLength(1024);
        entity.Property(c => c.ProviderCost).HasColumnType("numeric(18,4)");
        entity.Property(c => c.BilledCost).HasColumnType("numeric(18,4)");

        entity
            .Property(c => c.Transcription)
            .HasColumnType("jsonb")
            .HasConversion(
                v => v == null ? null : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => v == null ? null : JsonSerializer.Deserialize<Transcription>(v, (JsonSerializerOptions?)null)
            );
        entity.Property(c => c.RawTranscriptPayload).HasColumnType("text");
        entity.HasIndex(c => c.ExternalCallId).IsUnique();
        entity.HasIndex(c => new { c.AgentId, c.StartTime });
        entity.HasIndex(c => new { c.TenantId, c.StartTime });
        entity
            .HasOne(c => c.Agent)
            .WithMany(a => a.CallLogs)
            .HasForeignKey(c => c.AgentId)
            .OnDelete(DeleteBehavior.Restrict);

        entity
            .HasOne(c => c.Tenant)
            .WithMany()
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
