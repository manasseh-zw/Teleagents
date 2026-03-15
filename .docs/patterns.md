# Development Patterns & Conventions

> This document captures the architectural patterns, naming conventions, and code style code agents must follow these patterns faithfully — they represent the developer's preferred way of crafting .NET applications.

---

## 1. Folder & Project Structure

Each server project is a single ASP.NET Core Web API project. There are no separate class library projects or layered solution structures. Everything lives in one project and is organized by _concern_, not by horizontal layer.

```
MyProject.Server/
├── Config/              # Application configuration (static AppConfig class or Appsettings bind)
├── Data/ or Repository/ # DbContext + EF Core entity models
│   └── Models/          # One entity model per file
├── Domains/             # Feature domains — the core of the app
│   └── {DomainName}/    # All files for a domain in one flat folder
│       ├── {Domain}Controller.cs
│       ├── {Domain}Service.cs
│       ├── {Domain}Contracts.cs  (or {Domain}Dtos.cs)
│       └── {Domain}Validator.cs  (optional, FluentValidation)
├── Extensions/          # IServiceCollection extension methods (ServiceExtensions.cs)
├── Helpers/ or Utils/   # Shared utilities: Result type, Constants, etc.
├── Middleware/          # Custom ASP.NET middleware (exception handlers, etc.)
├── Migrations/          # EF Core migration files (auto-generated)
├── Integrations/        # Third-party service wrappers (Exa, Resend, etc.)
├── Authorization/       # Custom authorization handlers/requirements (if needed)
├── Properties/          # launch settings
├── Program.cs
└── appsettings.json
```

**Key rules:**

- All domain-related files are **co-located** in a single flat folder per domain under `Domains/`. Do not split controllers, services, and DTOs into separate top-level folders.
- `Repository/Models/` or `Data/Models/` holds only EF Core entity class definitions.
- `Extensions/ServiceExtensions.cs` is the single place where all DI registrations are grouped.
- Shared things used across domains (Result, Constants) live in `Helpers/` or `Utils/`, not scattered.

---

## 2. Naming Conventions

### Files

| Artifact                   | Convention                                  | Example                                                    |
| -------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Controller                 | `{Domain}Controller.cs`                     | `BookingController.cs`, `TicketsController.cs`             |
| Service (interface + impl) | `{Domain}Service.cs`                        | `BookingService.cs`, `TicketService.cs`                    |
| DTOs / Contracts           | `{Domain}Dtos.cs` or `{Domain}Contracts.cs` | `BookingDtos.cs`, `TicketContracts.cs`, `AuthContracts.cs` |
| Validator                  | `{Domain}Validator.cs`                      | `AuthValidator.cs`, `BookingValidator.cs`                  |
| EF Entity Model            | `{Name}Model.cs`                            | `UserModel.cs`, `TicketModel.cs`, `BookingModel.cs`        |
| DbContext                  | `RepositoryContext.cs`                      | `RepositoryContext.cs`                                     |
| Config                     | `AppConfig.cs` or `AppSettings.cs`          | `AppConfig.cs`                                             |
| Extensions                 | `ServiceExtensions.cs`                      | `ServiceExtensions.cs`                                     |

### Types

| Artifact           | Convention                                         | Example                                            |
| ------------------ | -------------------------------------------------- | -------------------------------------------------- |
| Interface          | `I{Name}`                                          | `IBookingService`, `ITicketService`                |
| Service class      | `{Name}Service`                                    | `BookingService`, `AuthService`                    |
| Controller class   | `{Name}Controller`                                 | `BookingController`, `TicketsController`           |
| Entity (EF model)  | `{Name}Model`                                      | `UserModel`, `TicketModel`                         |
| Request DTO        | `{Action}{Resource}Request`                        | `CreateTicketRequest`, `EmailSignUpRequest`        |
| Response DTO       | `Get{Resource}Response`                            | `GetTicketResponse`, `GetTicketsResponse`          |
| Flat input DTO     | `{Action}{Resource}Dto`                            | `AddBookingDto`, `UpdateBookingDto`, `RegisterDto` |
| Enum inside domain | Declared in the same file as the contract or model | `TicketStatus`, `AuthProvider`                     |

### Members

- Private fields use **underscore-prefixed camelCase**: `_repository`, `_logger`, `_authService`
- Properties use **PascalCase**: `public string Email { get; set; }`
- Method names use **PascalCase** (no `Async` suffix on any method — ever)
- Namespaces mirror the folder path: `Heydesk.Server.Domains.Ticket`, `FleetHQ.Server.Domains.Booking`

---

## 3. The Result Pattern

All service methods return a `Result` type — never throw exceptions back to the controller (exceptions are handled internally and converted to failures). There are two variants used across these projects; **heydesk's `Result<T>`** is the more evolved and preferred form going forward.

### Preferred: `Result<T>` (heydesk.server style)

```csharp
// Utils/Result.cs
public class Result<T>
{
    public T? Data { get; init; }
    public bool Success { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    private Result(bool success, T? data = default, IReadOnlyList<string>? errors = null)
    {
        Success = success;
        Data = data;
        Errors = errors ?? [];
    }

    public static Result<T> Ok(T data) => new(true, data);
    public static Result<T> Fail(string error) => new(false, default, [error]);
    public static Result<T> Fail(List<string> errors) => new(false, default, errors);
    public static Result<T> Fail(IReadOnlyList<string> errors) => new(false, default, errors);
    public static Result<T> Exception(string errorMessage) => new(false, default, [errorMessage]);

    // Implicit conversions allow returning T directly
    public static implicit operator Result<T>(T value) => Ok(value);
    public static implicit operator Result<T>(SuccessResult<T> successResult) => Ok(successResult.Data);
    public static implicit operator Result<T>(FailureResult failureResult) => Fail(failureResult.Errors);
}

// Non-generic factory struct — used in service code like: return Result.Ok(data);
public struct Result
{
    public static SuccessResult<T> Ok<T>(T data) => new(data);
    public static FailureResult Fail(string message) => new(message);
    public static FailureResult Fail(List<string> errors) => new(errors);
    public static FailureResult Fail(IReadOnlyList<string> errors) => new(errors);
    public static FailureResult Exception(string message) => new(message);
}
```

**Usage in services:**

```csharp
// Return success
return Result.Ok(new GetTicketResponse(...));

// Return failure (single message)
return Result.Fail("Ticket not found");

// Return failure with multiple messages
return Result.Fail(validationResult.Errors.Select(x => x.ErrorMessage).ToList());

// Exception case (log the exception, return generic failure)
catch (Exception ex)
{
    _logger.LogError(ex, "Error retrieving...");
    return Result.Fail("Failed to retrieve ticket");
}
```

**Service interface signature:**

```csharp
public interface ITicketService
{
    Task<Result<GetTicketsResponse>> GetTickets(Guid organizationId, GetTicketsRequest request);
    Task<Result<GetTicketResponse>> CreateTicket(Guid organizationId, CreateTicketRequest request);
}
```

---

## 4. Service Architecture

### Interface + Implementation in Same File

The service interface and its implementation always live together in the same `.cs` file:

```csharp
// TicketService.cs
public interface ITicketService
{
    Task<Result<GetTicketResponse>> CreateTicket(Guid organizationId, CreateTicketRequest request);
}

public class TicketService : ITicketService
{
    private readonly RepositoryContext _repository;
    private readonly ILogger<TicketService> _logger;

    public TicketService(RepositoryContext repository, ILogger<TicketService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Result<GetTicketResponse>> CreateTicket(Guid organizationId, CreateTicketRequest request)
    {
        // ...
    }
}
```

### Method Patterns

- **No `Async` suffix on method names.** `GetTickets`, not `GetTicketsAsync`. This is a firm rule.
- Methods that perform reads: return `Result.Ok(data)` on success.
- Methods that perform writes (create/update/delete): either return the newly created/updated entity or a success message.
- Null checks for entity lookups come **immediately** after the query: `if (entity == null) return Result.Fail("...")`.
- Services own **all business logic**: validation, authorization checks, data mapping, and persistence. Controllers do none of this.
- Internal private helper methods are used to share logic within the same service class (e.g., `AssignDriverAndVehicleInternal`).

### Exception Handling in Services

In services dealing with complex operations, wrap the entire method body in a `try/catch`, log the exception, and return `Result.Fail(...)` with a user-facing generic message:

```csharp
public async Task<Result<GetTicketsResponse>> GetTickets(Guid organizationId, GetTicketsRequest request)
{
    try
    {
        // ... logic
        return Result.Ok(new GetTicketsResponse(resultList, totalCount));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving tickets for organization {OrganizationId}", organizationId);
        return Result.Fail("Failed to retrieve tickets");
    }
}
```

Simpler CRUD operations (add/update/delete with known failure modes) can skip the try/catch and use early-return guard clauses.

---

## 5. Controllers

Controllers are **thin dispatchers**. No logic. No mapping. No validation. They simply:

1. Extract identity/route data from the request
2. Call the service
3. Return `Ok(result.Data)` or `BadRequest(result.Errors)` based on the result

```csharp
[ApiController]
[Route("api/organizations/{organizationId:guid}/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets([FromRoute] Guid organizationId, [FromQuery] GetTicketsRequest request)
    {
        var result = await _ticketService.GetTickets(organizationId, request);
        if (!result.Success)
            return BadRequest(result.Errors);
        return Ok(result.Data);
    }
}
```

Alternative one-liner style (also acceptable):

```csharp
var result = await _bookingService.GetBookings(Guid.Parse(companyId));
return result.IsSuccess ? Ok(result) : BadRequest(result);
```

### Route Conventions

- Simple domains: `[Route("api/[controller]")]` → `api/booking`
- Resource-scoped domains: `[Route("api/organizations/{organizationId:guid}/tickets")]` — embed parent resource IDs in the route path for nested resources
- Route parameters use `:guid` type constraints: `{ticketId:guid}`, `{organizationId:guid}`
- Sub-actions use descriptive kebab-case suffixes: `"{bookingId}/assign"`, `"email-sign-up"`, `"google-auth"`, `"with-conversation"`

### Authorization

- Apply `[Authorize]` at the **controller level** by default
- Use `[AllowAnonymous]` on specific actions that are public (e.g., sign-in, sign-up)
- Specific auth schemes are targeted per-endpoint when needed: `[Authorize(AuthenticationSchemes = "UserBearer")]`
- Controllers are registered globally with `.RequireAuthorization()` in `Program.cs`, but controller-level `[Authorize]` is still explicit

---

## 6. DTOs & Contracts

### Use C# Records

All DTOs (requests, responses) are C# `record` types — not classes:

```csharp
// Positional record (preferred for responses — concise, immutable)
public record GetTicketResponse(
    Guid Id,
    string Subject,
    string? Context,
    TicketStatus Status,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    AssignedToInfo? AssignedTo,
    CustomerInfo Customer
);

// Property record (preferred for incoming requests with optional/default values)
public record AddBookingDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerContact { get; set; } = string.Empty;
    public int PassengerCount { get; set; }
    public DateTime Time { get; set; }
    public Guid? DriverId { get; set; }
}
```

**Rule of thumb:**

- Use **positional records** for responses (read-only, returned from service).
- Use **property records** with default initializers for requests/inputs (deserialised from JSON, may have optional fields).

### Naming

- Input: `{Action}{Resource}Request` → `CreateTicketRequest`, `EmailSignUpRequest`
- Response: `Get{Resource}Response` → `GetTicketResponse`, `GetTicketsResponse`
- Flat DTO (older style): `{Action}{Resource}Dto` → `AddBookingDto`, `RegisterDto`
- Paginated request: `Get{Resources}Request(int Page = 1, int PageSize = 10)` with default values

### Contracts File

All DTOs / contracts for a domain are co-located in one file next to the service:

- `{Domain}Contracts.cs` (heydesk style, preferred) or `{Domain}Dtos.cs` (fleethq style)
- Enums that are part of the domain's public contract live in the same contracts file: `TicketStatus`, `AssignedEntityType`
- When contracts span multiple auth personas (e.g., user vs customer), they are organized within a wrapping static class `AuthContracts { ... }` to namespace them clearly, accessed via `using static ... AuthContracts`

---

## 7. Entity Models (EF Core)

### Model Class Structure

```csharp
// Data/Models/TicketModel.cs
namespace Heydesk.Server.Data.Models;

public class TicketModel
{
    public Guid Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Context { get; set; }                      // nullable = optional field
    public TicketStatus Status { get; set; } = TicketStatus.Open; // default value

    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    // FK + Navigation property pair always together
    public Guid OrganizationId { get; set; }
    public OrganizationModel Organization { get; set; } = null!;

    public Guid CustomerId { get; set; }
    public CustomerModel Customer { get; set; } = null!;
}
```

**Conventions:**

- Model class name always suffixed with `Model`: `TicketModel`, `UserModel`, `BookingModel`
- `Id` is always `Guid`, never `int`
- Timestamps: `DateTime.UtcNow` (not local time). Use `DateTime` for simpler cases, `DateTimeOffset` when timezone precision matters
- Non-nullable string properties initialized to `string.Empty`
- Required navigation properties initialized to `null!` (tells compiler it's set by EF)
- Optional navigation properties typed as nullable: `CompanyModel? Company`
- Enums defined in the same file as their owning model (or in the contracts file if exposed via API)
- One model per file

### Relationship Mapping in `RepositoryContext`

Relationships are configured using the **Fluent API** inside `OnModelCreating`, not data annotations on the model class

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<OrganizationModel>(entity =>
    {
        entity.ToTable("Organizations");

        entity.HasIndex(o => o.Slug)
            .IsUnique()
            .HasDatabaseName("IX_Organizations_Slug");

        entity.HasMany(o => o.Members)
            .WithOne(u => u.Organization)
            .HasForeignKey(u => u.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);

        entity.HasMany(o => o.Documents)
            .WithOne(d => d.Organization)
            .HasForeignKey(d => d.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
    });
}
```

- Table names are configured explicitly with `.ToTable("Name")` using PascalCase plural names
- Index names follow: `IX_{Table}_{Column}`
- Cascade deletes are explicit — never rely on EF defaults silently

### DbContext (`RepositoryContext`)

- Named `RepositoryContext` (not `AppDbContext` or `DatabaseContext`)
- Uses **primary constructor** syntax: `public class RepositoryContext(DbContextOptions<RepositoryContext> options) : DbContext(options)`
- `DbSet<T>` properties use plural entity names (without "Model" suffix): `DbSet<UserModel> Users`, `DbSet<TicketModel> Tickets`

---

## 8. Configuration Pattern

### Preferred: Environment Variable / dotenv (`AppConfig.cs` — heydesk style)

Configuration is read directly from **environment variables**. A static `AppConfig` class holds all configuration properties, grouped into typed records:

```csharp
// Config/AppConfig.cs
public static class AppConfig
{
    public static void Initialize()
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (string.Equals(environment, "Development"))
        {
            DotEnv.Load(); // loads .env file in dev
        }
    }

    public static JwtOptions JwtOptions { get; } =
        new(
            Environment.GetEnvironmentVariable("JWT_SECRET")
                ?? throw new Exception("JWT secret key is not set"),
            Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? throw new Exception("JWT issuer is not set"),
            Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                ?? throw new Exception("JWT audience is not set")
        );

    public static Database Database { get; } =
        new(
            Environment.GetEnvironmentVariable("LOCAL_DATABASE")
                ?? throw new Exception("Local Database Connection String is not set"),
            Environment.GetEnvironmentVariable("CLOUD_DATABASE")
                ?? throw new Exception("Cloud Database Connection String is not set"),
            // ...
        );
}

// Config types are positional records:
public record JwtOptions(string Secret, string Issuer, string Audience);
public record Database(string LocalConnectionString, string CloudConnectionString, string VectorConnectionString);
```

- `AppConfig.Initialize()` is called at the top of `Program.cs` before `builder.Services.*`
- Missing required config causes an immediate startup exception with a clear message — no silent failures
- Each logical config group (JWT, Database, external APIs) gets its own typed record
- In production the values come from the host environment; `.env` is dev-only

### Older Variant: `appsettings.json` Bind (`Appsettings.cs` — fleethq style)

```csharp
public class Appsettings
{
    public const string ConnectionStrings = "ConnectionStrings";
    public const string JwtConfig = "JwtConfig";
    public static DatabaseOptions DatabaseOptions { get; set; } = new();
    public static JwtOptions JwtOptions { get; set; } = new();
}
// Used in Program.cs:
builder.Configuration.GetSection(Appsettings.JwtConfig).Bind(Appsettings.JwtOptions);
```

This pattern is valid but the env-var / dotenv approach is preferred for new projects as it cleanly separates secrets from code and works uniformly across environments.

---

## 9. Service Registration (DI)

### Extension Methods on `IServiceCollection`

All service registrations are extracted into extension methods in `Extensions/ServiceExtensions.cs`. `Program.cs` just calls them:

```csharp
// Program.cs
builder.Services.ConfigureDatabase();
builder.Services.ConfigureAuthentication();
builder.Services.AddAuthorization();
builder.Services.ConfigureDomainServices();
builder.Services.ConfigureSignalR();
```

```csharp
// Extensions/ServiceExtensions.cs
public static class ServiceExtensions
{
    public static IServiceCollection ConfigureDatabase(this IServiceCollection services) { ... return services; }
    public static IServiceCollection ConfigureAuthentication(this IServiceCollection services) { ... return services; }
    public static IServiceCollection ConfigureDomainServices(this IServiceCollection services)
    {
        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<IAgentService, AgentService>();
        services.AddScoped<IConversationsService, ConversationsService>();
        // ...
        return services;
    }
}
```

### Lifetimes

- Services with DB access → `AddScoped`
- Singletons (queues, publishers, caches) → `AddSingleton`
- Transient utilities (Resend client, etc.) → `AddTransient`
- `HttpClient` integrations registered via `AddHttpClient<TInterface, TImpl>()`

---

## 10. Program.cs Structure

`Program.cs` is kept minimal — it orchestrates the app with clear, grouped sections:

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. Initialize configuration
AppConfig.Initialize();

// 2. Register infrastructure
builder.Services.AddOpenApi();
builder.Services.ConfigureDatabase();
builder.Services.ConfigureAuthentication();
builder.Services.AddAuthorization();

// 3. Register controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 4. Register domain services
builder.Services.ConfigureDomainServices();
builder.Services.ConfigureSignalR();

// 5. CORS
builder.Services.AddCors(options => { ... });

var app = builder.Build();

// 6. Middleware pipeline
app.MapOpenApi();
app.UseCors("policy-name");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireAuthorization();
app.MapHub<NotificationsHub>("/hubs/notifications").RequireAuthorization();
app.UseExceptionHandler(options => { });

app.Run();
```

- Enums are serialised as strings: `JsonStringEnumConverter` is always added
- Global exception handler is always wired up: `app.UseExceptionHandler(options => { })`
- SignalR hubs are mapped with explicit paths (e.g., `/hubs/notifications`, `/hubs/chat`)
- CORS policy is named (not anonymous) and always includes `AllowCredentials()` when cookies are used

---

## 11. Validation (FluentValidation)

Validators use `AbstractValidator<TDto>` from **FluentValidation**. They are instantiated directly in the service (not injected):

```csharp
// BookingService.cs
var validationResult = new BookingValidator().Validate(booking);
if (!validationResult.IsValid)
{
    return XResult.Fail(validationResult.Errors.Select(x => x.ErrorMessage).ToList());
}
```

```csharp
// BookingValidator.cs
public class BookingValidator : AbstractValidator<BookingModel>
{
    public BookingValidator()
    {
        RuleFor(u => u.Password)
            .NotEmpty().WithMessage("Password must not be empty")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters");

        RuleFor(u => u.Email)
            .NotEmpty().WithMessage("Email must not be empty")
            .EmailAddress().WithMessage("Invalid email address");
    }
}
```

- Validators validate the **model or DTO**, not just the request
- Validation happens inside the service, before any database writes
- Validation errors bubble up as a `Result.Fail(List<string>)` — never as exceptions

---

## 12. Querying Patterns (EF Core)

- Use `.Select(x => new ResponseDto(...))` directly in LINQ queries to avoid over-fetching (project at the DB level)
- Filter by tenant/org scope first: `.Where(t => t.OrganizationId == organizationId)`
- `.Include()` is used for navigation properties needed in the result; avoid deep chains
- Use `.AnyAsync(...)` for existence checks instead of fetching the full entity
- `Guid.CreateVersion7()` for new entity IDs (not `Guid.NewGuid()`) — produces time-sortable UUIDs
- `DateTime.UtcNow` always — never local time

---

## 13. Authentication Patterns

### JWT via HttpOnly Cookies

Auth tokens are stored in **HttpOnly, Secure cookies** — never returned in the response body:

```csharp
// In the controller (auth is the only place cookie logic lives):
private static void SetAuthCookie(HttpContext httpContext, string token)
{
    httpContext.Response.Cookies.Append(
        Constants.AccessTokenCookieName,
        token,
        new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(14),
        }
    );
}
```

- The token is set in the cookie; the response body returns only the user/customer data
- Cookie names are defined in a `Constants` class (never hardcoded inline)

### Constants

Shared string constants (claim names, cookie names, etc.) are in a `Constants.cs` file:

```csharp
// shared/Constants.cs  or  Utils/Constants.cs
public static class Constants
{
    public const string CompanyId = "CompanyId";
    public const string AccessTokenCookieName = "access_token";
    public const string CustomerAccessTokenCookieName = "customer_access_token";
}
```

### Claims Extraction in Controllers

```csharp
var companyId = User.FindFirst(Constants.CompanyId)?.Value;
if (companyId == null) return Unauthorized();

// Or:
if (Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
{
    // ...
}
return Unauthorized("User not authenticated");
```

---

## 14. General Code Style

- **No `Async` suffix on any method** — this is a firm preference, not negotiable
- Prefer **early returns** (guard clauses) over deeply nested `if` blocks
- **C# 12 collection expressions:** Refactor all array and collection initializations to use `[]` and `[x, y]` syntax. Do not use `new T[] { }`, `Array.Empty<T>()`, or `new[] { ... }` — use collection expressions for better performance and readability.

  | Avoid | Use instead |
  |-------|-------------|
  | `new int[] { 1, 2 }` | `[1, 2]` |
  | `new[] { "a", "b" }` | `["a", "b"]` |
  | `Array.Empty<string>()` | `[]` |
  | `new List<int>()` (when a collection expression is applicable) | `[]` (if the target type accepts it) |

  Examples: empty `var errors = [];`; with elements `var items = [1, 2, 3];`, `var messages = ["First error", "Second error"]`.
- Use **`null!`** on required navigation properties to satisfy nullable reference checks
- `string.Empty` for default string values — never `""`
- `is null` / `is not null` over `== null` / `!= null` where idiomatic
- Implicit typing (`var`) always where the type is obvious from context
- Avoid verbosity: prefer `new()` over `new SomeType()` where the type is clear
- Method bodies are not wrapped in try/catch unless genuinely needed for exception-to-Result conversion
- Private helper methods within a service class (no separate "internal service" class) for shared logic
- Comments should explain _why_, not _what_

---

## 15. Integrations / Third-Party Wrappers

External API clients are wrapped in a dedicated class under `Integrations/`:

```
Integrations/
├── ExaWebScraper.cs    (wraps the Exa search/scraping API)
├── EmailService.cs     (wraps Resend)
└── VectorStore.cs      (wraps pgvector / AI vector queries)
```

- Integration classes implement an interface: `IExaWebScraper`, `IEmailService`, `IVectorStore`
- Registered via `AddHttpClient<TInterface, TImpl>()` for HTTP-based clients
- Configuration pulled from `AppConfig.*` directly inside the integration constructor or method — not passed in from outside

---

## Summary Cheat Sheet

| Concern                 | Pattern                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| No. of projects         | Single project per server                                                 |
| Domain organisation     | Flat folder per domain under `Domains/`                                   |
| Result type             | `Result<T>` with `Result.Ok(...)` / `Result.Fail(...)` factory struct     |
| Method naming           | PascalCase, **no Async suffix**                                           |
| DTOs                    | C# `record` types (`{Action}{Resource}Request`, `Get{Resource}Response`)  |
| Entity models           | Class suffixed with `Model`, `Guid` PKs, `null!` for nav props            |
| DbContext name          | `RepositoryContext`                                                       |
| Service/Interface       | Co-located in same file, `I{Name}Service` / `{Name}Service`               |
| Services in controllers | Single service injection, thin dispatch                                   |
| DI registration         | Explicit `IServiceCollection` extension methods in `ServiceExtensions.cs` |
| Config                  | Static `AppConfig` reading env vars, typed records per group              |
| Validation              | FluentValidation `AbstractValidator<T>`, called from service              |
| Auth tokens             | HttpOnly secure cookies, set in controller, never in body                 |
| Timestamps              | `DateTime.UtcNow`, `Guid.CreateVersion7()` for new IDs                    |
| String defaults         | `string.Empty`, not `""`                                                  |
| Enum serialisation      | Always `JsonStringEnumConverter` registered globally                      |
