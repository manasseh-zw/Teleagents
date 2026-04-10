using Microsoft.Extensions.DependencyInjection;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Teleagents.Config;
using Teleagents.Providers.Abstractions.Contracts;
using Teleagents.Providers.ElevenLabs.Generated;
using Teleagents.Providers.ElevenLabs.Services;

namespace Teleagents.Providers.ElevenLabs.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddElevenLabsProvider(this IServiceCollection services)
    {
        services.AddHttpClient(
            "ElevenLabs",
            (_, httpClient) =>
            {
                var config = Configuration.ElevenLabs;
                httpClient.BaseAddress = new Uri(config.BaseUrl);
                httpClient.DefaultRequestHeaders.Add("xi-api-key", config.ApiKey);
            }
        );

        services.AddScoped<ElevenLabsApiClient>(serviceProvider =>
        {
            var httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
            var httpClient = httpClientFactory.CreateClient("ElevenLabs");
            var requestAdapter = new HttpClientRequestAdapter(
                new AnonymousAuthenticationProvider(),
                httpClient: httpClient
            );

            requestAdapter.BaseUrl = Configuration.ElevenLabs.BaseUrl;
            return new ElevenLabsApiClient(requestAdapter);
        });

        services.AddScoped<IVoiceProviderService, ElevenLabsVoiceProviderService>();

        return services;
    }
}
