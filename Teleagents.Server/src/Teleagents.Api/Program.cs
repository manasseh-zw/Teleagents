using System.Text.Json.Serialization;
using Teleagents.Api.Extensions;
using Teleagents.Config;

var builder = WebApplication.CreateBuilder(args);

Configuration.Initialize();

builder.Services.AddOpenApi();

builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
builder.Services.ConfigureDatabase(Configuration.Database.ConnectionString);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
