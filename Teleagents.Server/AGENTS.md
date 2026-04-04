# AGENTS.md

Scope: this file applies to work inside `Teleagents.Server/`.

These are the server conventions to follow when editing or adding .NET code. They are derived from [.docs/patterns.md](/Users/manasseh/Projects/next/teleagents/main/Teleagents/.docs/patterns.md) and should be treated as the active agent guidance for the server codebase.

## Structure

- Follow the existing server solution layout in this repo.
- Within each project, organize code by concern.
- Keep EF entity models in `Data/Models/`.
- Keep DI registration in `Extensions/ServiceExtensions.cs`.
- Keep shared helpers in `Helpers/`.
- Keep middleware in `Middleware/`.
- Keep domain-specific code co-located in a flat folder per domain when domains are introduced.
- Keep provider-specific generated and wrapper code out of `Teleagents.Api` unless explicitly changing the architecture.

## Naming

- Controllers: `{Domain}Controller`
- Services: `I{Name}Service` and `{Name}Service`
- Contracts/DTO files: `{Domain}Contracts.cs` or `{Domain}Dtos.cs`
- Validators: `{Domain}Validator.cs`
- EF entities: `{Name}Model`
- DbContext: `RepositoryContext`
- Private fields: `_camelCase`
- Properties and methods: `PascalCase`
- Do not use the `Async` suffix on method names.

## Services And Controllers

- Keep the service interface and implementation in the same file.
- Services own business logic, validation, authorization checks, mapping, and persistence.
- Controllers stay thin: extract request data, call the service, return `Ok(...)` or `BadRequest(...)`.
- Prefer early returns over nested conditionals.
- Use private helper methods inside the same service class when logic needs sharing.

## Result Pattern

- Service methods should return `Result` or `Result<T>`.
- Do not throw exceptions back to controllers for expected failures.
- Log exceptions in services where exception-to-result conversion is needed, then return `Result.Fail(...)`.

## DTOs And Entities

- Use C# `record` types for request and response contracts.
- Prefer positional records for responses.
- Prefer property records with defaults for incoming requests.
- Keep one EF model per file.
- Use `Guid` IDs.
- Use `string.Empty` for default string values.
- Use `null!` for required EF navigation properties.
- Value objects and nested types do not need the `Model` suffix.
- Enum type names should be entity-specific, while the property name can stay short, for example `CallStatus Status`.

## EF Core

- Configure relationships and indexes with the Fluent API in `RepositoryContext`.
- Keep table-backed entity names suffixed with `Model`.
- `DbSet<T>` properties should use plural names without the `Model` suffix.
- Filter by tenant or organization explicitly in queries.
- Use `.Select(...)` projections to shape responses at the query level when practical.
- Use `.AnyAsync(...)` for existence checks instead of loading full rows.
- Use `Guid.CreateVersion7()` for new IDs when adding new write paths.
- Use `DateTime.UtcNow` for timestamps.

## DI And Program Setup

- Keep `Program.cs` minimal.
- Group registrations behind `IServiceCollection` extension methods.
- Register DB-backed services as `AddScoped`.
- Register HTTP integrations with `AddHttpClient<TInterface, TImpl>()` when appropriate.
- Register `JsonStringEnumConverter` globally for controllers.
- Keep a global exception handler wired up.

## Config And Auth

- Prefer environment-variable based configuration with typed config records.
- Fail fast on missing required config.
- Apply authorization at the controller or route-group level as appropriate.
- Keep auth token transport decisions explicit and centralized.

## Validation

- Use FluentValidation validators when the project introduces validation.
- Run validation in services, before persistence.
- Return validation failures through `Result.Fail(...)`, not exceptions.

## Code Style

- Use `var` when the type is obvious.
- Prefer `is null` / `is not null` where idiomatic.
- Prefer `new()` when the type is clear.
- Use C# 12 collection expressions like `[]` and `[a, b]`.
- Keep comments focused on why, not what.
- Avoid unnecessary try/catch blocks.

## Integration Rule

- Wrap third-party APIs behind Teleagents-owned interfaces.
- Do not let generated provider types leak through the API layer unless explicitly intended.
