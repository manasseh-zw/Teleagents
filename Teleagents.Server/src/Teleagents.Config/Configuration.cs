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

    public static ElevenLabsConfiguration ElevenLabs { get; } =
        new(
            Environment.GetEnvironmentVariable("ELEVENLABS_API_KEY")
                ?? throw new Exception("ELEVENLABS_API_KEY is not set"),
            Environment.GetEnvironmentVariable("ELEVENLABS_BASE_URL") ?? "https://api.elevenlabs.io"
        );
}

public record DatabaseConfiguration(string ConnectionString);

public record ElevenLabsConfiguration(string ApiKey, string BaseUrl);
