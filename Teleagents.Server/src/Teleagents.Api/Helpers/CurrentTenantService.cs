using Microsoft.EntityFrameworkCore;
using Teleagents.Api.Data;
using Teleagents.Api.Data.Models;
using Teleagents.Config;

namespace Teleagents.Api.Helpers;

public interface ICurrentTenantService
{
    Task<Result<TenantModel>> GetCurrentTenantAsync(CancellationToken cancellationToken = default);
}

public class CurrentTenantService : ICurrentTenantService
{
    private readonly RepositoryContext _repository;

    public CurrentTenantService(RepositoryContext repository)
    {
        _repository = repository;
    }

    public async Task<Result<TenantModel>> GetCurrentTenantAsync(
        CancellationToken cancellationToken = default
    )
    {
        var tenant = await _repository
            .Tenants.AsNoTracking()
            .FirstOrDefaultAsync(
                tenant => tenant.Id == Configuration.Api.DefaultTenantId,
                cancellationToken
            );

        if (tenant is null)
        {
            return Result<TenantModel>.Failure("Configured default tenant was not found");
        }

        return Result<TenantModel>.Success(tenant);
    }
}
