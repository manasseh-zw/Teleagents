using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Teleagents.Api.Data;
using Teleagents.Api.Middleware;

namespace Teleagents.Api.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection ConfigureExceptionHandler(this IServiceCollection services)
    {
        services.AddExceptionHandler<GlobalExceptionHandler>();
        return services;
    }

    public static IServiceCollection ConfigureDatabase(
        this IServiceCollection services,
        string connectionString
    )
    {
        services.AddDbContext<RepositoryContext>(options => options.UseNpgsql(connectionString));

        return services;
    }
}
