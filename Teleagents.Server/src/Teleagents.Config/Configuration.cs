using dotenv.net;

namespace Teleagents.Config;

public static class Configuration
{
    private static bool _initialized;

    public static void Initialize()
    {
        if (_initialized)
        {
            return;
        }

        //get the current environment
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

        //if in development load from .env file else will get from host
        if (string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase))
        {
            DotEnv.Load();
        }

        _initialized = true;
    }

    public static DatabaseConfiguration Database =>
        new(GetRequiredEnvironmentVariable("DATABASE_URL"));

    public static ElevenLabsConfiguration ElevenLabs =>
        new(
            GetRequiredEnvironmentVariable("ELEVENLABS_API_KEY"),
            Environment.GetEnvironmentVariable("ELEVENLABS_BASE_URL") ?? "https://api.elevenlabs.io"
        );

    public static ApiConfiguration Api => new(GetRequiredGuid("DEFAULT_TENANT_ID"));

    private static string GetRequiredEnvironmentVariable(string name)
    {
        EnsureInitialized();

        return Environment.GetEnvironmentVariable(name)
            ?? throw new Exception($"{name} is not set");
    }

    private static Guid GetRequiredGuid(string name)
    {
        var value = GetRequiredEnvironmentVariable(name);

        return Guid.TryParse(value, out var result)
            ? result
            : throw new Exception($"{name} is not a valid GUID");
    }

    private static void EnsureInitialized()
    {
        if (!_initialized)
        {
            Initialize();
        }
    }
}

public record DatabaseConfiguration(string ConnectionString);

public record ElevenLabsConfiguration(string ApiKey, string BaseUrl);

public record ApiConfiguration(Guid DefaultTenantId);
