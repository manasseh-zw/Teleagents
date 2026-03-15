using Microsoft.EntityFrameworkCore;
using Teleagents.Api.Data;

namespace Teleagents.Api.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection ConfigureDatabase(
        this IServiceCollection services,
        string connectionString
    )
    {
        services.AddDbContext<RepositoryContext>(options => options.UseNpgsql(connectionString));

        return services;
    }
}
