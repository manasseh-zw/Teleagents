using System.Text.Json.Serialization;
using Teleagents.Api.Extensions;
using Teleagents.Config;
using Teleagents.Providers.ElevenLabs.Extensions;

var builder = WebApplication.CreateBuilder(args);

Configuration.Initialize();

builder.Services.AddOpenApi();

builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.ConfigureExceptionHandler();
builder.Services.ConfigureDatabase(Configuration.Database.ConnectionString);
builder.Services.ConfigureDomainServices();
builder.Services.AddElevenLabsProvider();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
