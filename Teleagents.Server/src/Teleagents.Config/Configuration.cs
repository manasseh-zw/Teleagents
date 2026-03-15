using dotenv.net;

namespace Teleagents.Config;

public static class Configuration
{
    public static void Initialize()
    {
        //get the current environment
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

        //if in development load from .env file else will get from host
        if (string.Equals(environment, "Development"))
        {
            DotEnv.Load();
        }
    }

    public static DatabaseConfiguration Database { get; } =
        new(
            Environment.GetEnvironmentVariable("DATABASE_URL")
                ?? throw new Exception("DATABASE_URL is not set")
        );
}

public record DatabaseConfiguration(string ConnectionString);
