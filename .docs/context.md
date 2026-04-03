# TeleAgents Context & Architecture Guide

## System Overview

TeleAgents is a B2B voice AI platform by Nextsoft targeting Zimbabwe and the broader African market. The product provides enterprise customers with custom-trained, African-accented voice agents for inbound reception, outbound campaigns, and call center automation.

We are currently building **V0**.

## V0 Product Philosophy

TeleAgents V0 is a **managed-service thin wrapper**, not a self-serve agent builder.

The platform team configures agents internally in ElevenLabs, including:

- system prompts
- knowledge base setup
- voice selection and voice clones
- provider-side caveats and operational settings

Clients do **not** get full control over agent creation or low-level AI configuration in V0. That work is handled internally because reproducing the full provider experience in our own UI would add too much complexity too early.

The customer-facing platform should stay intentionally simple and focused on visibility and trust.

## V0 Customer-Facing Scope

The client-facing portal should allow organization users to:

- view basic dashboard statistics
- see the active agents available to their organization
- test agents in a playground
- view the current knowledge base or what information the agent has access to
- see conversation history tied to a specific agent
- view call logs, transcripts, durations, and related operational details

The client-facing portal should **not** allow customers to:

- create agents themselves
- configure system prompts
- manage provider-side voice settings
- manage provider-side knowledge base configuration directly

## Internal Console Scope

We will also have a very small internal tool for TeleAgents staff.

Its purpose is not to recreate the ElevenLabs UI. Its purpose is to let staff perform the minimum internal operations needed to manage customers safely and efficiently.

The internal console should support simple workflows such as:

- creating or selecting a tenant / organization
- pasting or associating a provider agent ID that was already configured in ElevenLabs
- attaching that provider agent to a TeleAgents tenant
- entering TeleAgents-side metadata such as display name, avatar, phone number, provider, and active status
- optionally viewing or verifying provider metadata if needed

The internal console should remain small. It exists to avoid manual SQL and reduce operational friction, not to become a second full product.

## High-Level Architecture Direction

For this phase, we are using:

- **one repository**
- **one shared backend**
- **two separate frontend apps**

This is a simple monorepo, but we are **not** using a monorepo management framework like Turborepo or Nx yet. We will keep the setup lightweight and manage the frontend apps with a root `package.json` and simple scripts.

## Repository Structure Direction

Recommended top-level structure:

```text
Teleagents/
  package.json
  .docs/
  specs/
  scripts/
  Teleagents.Server/
    Teleagents.Server.sln
    src/
      Teleagents.Api/
      Teleagents.Config/
      Teleagents.Providers.Abstractions/
      Teleagents.Providers.ElevenLabs/
  apps/
    client/
    console/
```

### Notes on Structure

- The repository root is the monorepo root.
- `Teleagents.Server/` contains the .NET solution and related projects.
- `Teleagents.Server.sln` represents the .NET solution, not the entire monorepo management system.
- `Teleagents.Server/src/` contains .NET projects.
- `apps/client/` contains the tenant-facing TanStack Start frontend.
- `apps/console/` contains the internal staff-facing TanStack Start frontend.
- The root `package.json` is used to coordinate frontend scripts, workspace management, and local developer workflows.

## Frontend Direction

Both frontend apps are planned to be built with:

- TanStack Start
- React
- Tailwind CSS
- shadcn/ui

The apps are separate because they serve different users and different responsibilities:

- `client` is for customer organization users
- `console` is for TeleAgents internal operators

Keeping them separate reduces accidental coupling and keeps each UI focused.

## Backend Direction

The backend remains a shared ASP.NET Core Web API.

It should expose separate route areas for different audiences, for example:

- `/api/platform/*` for tenant-facing application features
- `/api/internal/*` for staff-only internal operations

The important rule is that the boundary must be enforced in the backend with proper authorization, not only hidden in the frontend UI.

## Authentication and Authorization

Authentication is planned around **WorkOS** for B2B SSO.

### Client Portal Authentication

- organization users authenticate with WorkOS
- users are routed into the correct organization / tenant workspace
- users can only access data for their own tenant

### Internal Console Authentication

- internal staff authenticate separately in logical terms, even if WorkOS is also used for staff login
- internal users must be protected by staff-only roles or policies
- internal staff may deliberately select or operate within a tenant context
- tenant users must never be able to access internal routes or internal UI

Recommended role and policy thinking:

- `TenantViewer` / `TenantAdmin` for customer organization users
- `PlatformStaff` for TeleAgents internal operators

## Subdomain Direction

Recommended subdomain layout:

- `teleagents.co.zw` for the main marketing site
- `platform.teleagents.co.zw` or `app.teleagents.co.zw` for the client portal
- `console.teleagents.co.zw` for the internal console

The internal console should live on a distinct subdomain, but it does **not** need a separate repository from day one.

## Tech Stack

- **Backend:** .NET 10, C#, ASP.NET Core Web API
- **ORM:** Entity Framework Core targeting PostgreSQL
- **Frontend:** TanStack Start (React)
- **Authentication:** WorkOS for B2B Enterprise SSO
- **Telephony:** FreePBX on Azure VM, SIP trunking via TelOne
- **AI Voice Provider:** ElevenLabs

## Provider Integration Strategy

ElevenLabs should be treated as a provider behind an internal abstraction.

We should expose an internal interface such as `IVoiceProviderService` and keep our own database as the source of truth.

Important rule:

- our internal `Agent.Id` maps to the provider's `ProviderAgentId`
- we do not rely on naming conventions to identify provider resources

## ElevenLabs SDK Generation Direction

We plan to generate a .NET client for ElevenLabs from their OpenAPI spec using **Microsoft Kiota**.

That generated code should live inside the ElevenLabs provider project, not spread across the rest of the solution.

Recommended shape:

```text
Teleagents.Server/
  src/
    Teleagents.Providers.Abstractions/
      Contracts/
      Teleagents.Providers.Abstractions.csproj
    Teleagents.Providers.ElevenLabs/
      Generated/
      Services/
      Mapping/
      Teleagents.Providers.ElevenLabs.csproj
```

### Why

- generated code stays isolated
- regeneration is safer and easier
- handwritten adapter logic is separated from generated client code
- the rest of the application depends on our abstraction, not on provider-specific generated types
- provider concerns stay out of the main API project

The OpenAPI spec may also be stored in a tracked location in the repository so regeneration is deterministic and repeatable.

## API Client Generation For Our Own Frontends

We may eventually generate a typed client for our own frontend apps from the TeleAgents API OpenAPI spec.

However, this is **not a V0 priority**.

For now:

- design backend endpoints cleanly
- use DTOs consistently
- expose accurate OpenAPI
- keep contracts intentional

Only introduce generated frontend API clients once the main platform endpoints are stable enough that generation meaningfully reduces duplication.

This means:

- generating the ElevenLabs SDK now is justified because it solves an immediate backend integration problem
- generating a full client SDK for `client` and `console` can wait until we have a stable set of platform endpoints

## Call Flow and Logging

High-level call flow:

1. TelOne routes calls through the SIP infrastructure.
2. FreePBX handles telephony routing.
3. Calls are connected to the AI provider.
4. The provider sends webhooks to our backend.
5. Our backend stores call history, transcripts, durations, and costs.

Call transfers back to human operators are handled by the provider using SIP transfer capabilities such as `SIP REFER`, with FreePBX remaining the telephony control point on our side.

## Domain Relationships

The domain model follows a flat, multi-tenant architecture.

- **Tenant:** The root organization, such as a bank or enterprise customer. Contains branding information such as `Name`, `Domain`, and `LogoUrl`.
- **User:** A user mapped via WorkOS. Belongs to one `Tenant`.
- **Agent:** The TeleAgents representation of an AI agent. Belongs to one `Tenant`. Holds both customer-facing metadata and provider mapping information.
- **CallLog:** Historical record of a call. Belongs to an `Agent`, but also contains a direct `TenantId`.

### Important `CallLog` Rule

`CallLog` must keep both:

- `AgentId`
- `TenantId`

This denormalized hybrid relationship is intentional. It improves tenant-safe querying and reduces the risk of cross-tenant leaks.

## Entity Framework Core Rules

To avoid common EF Core and serialization issues, follow these rules:

1. **Navigation Property Nullability**

- Collection navigations should be initialized immediately.
- Required singular navigations should use `= null!;`.
- Do not instantiate fake related entities just to satisfy the compiler.

2. **JSON Serialization Safety**

If controllers ever serialize tracked graphs by mistake, we still want to avoid immediate reference loop failures. Ensure controller JSON options are configured safely:

```csharp
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
```

3. **DTOs Over Entities**

- Never return raw EF Core entities directly from controllers.
- Always map to DTOs for frontend consumption.

4. **Read Query Performance**

- Prefer `.Select()` projection for read-only endpoints.
- Avoid unnecessary `.Include()` on dashboard-style queries.
- Use `.Include()` only when loading entities that will be mutated and saved.

5. **`CallLog` Multiple Cascade Path Protection**

Because `CallLog` references both `Agent` and `Tenant`, configure the `Tenant -> CallLog` relationship with restricted delete behavior in the `DbContext`:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<CallLog>()
        .HasOne(c => c.Tenant)
        .WithMany()
        .HasForeignKey(c => c.TenantId)
        .OnDelete(DeleteBehavior.NoAction);
}
```

6. **Multi-Tenant Security**

- enforce tenant isolation globally wherever possible
- use tenant-aware filtering in the `DbContext`
- ensure tenant users can never read data from another organization
- do not rely only on frontend checks for security

## Current Build Strategy

We are intentionally choosing execution over over-optimization.

That means:

- keep the client portal small and useful
- keep the internal console minimal
- generate the ElevenLabs SDK because it solves a real need now
- delay generation of our own frontend SDK until the platform API stabilizes
- avoid prematurely building a full self-serve AI configuration product

## Summary

TeleAgents V0 is a managed-service platform with:

- a tenant-facing read-only dashboard and playground
- a minimal internal console for staff
- one shared backend
- two frontend apps in one repository
- WorkOS-based enterprise authentication
- tenant-safe multi-tenant data access
- ElevenLabs integration hidden behind our own provider abstraction
