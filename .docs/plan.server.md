# TeleAgents Server — Backend Execution Plan (V0)

## Current State

The server solution currently contains four .NET projects:

- `Teleagents.Api` — ASP.NET Core Web API
- `Teleagents.Config` — config loader using `dotenv.net`
- `Teleagents.Providers.Abstractions` — Teleagents-owned provider contracts
- `Teleagents.Providers.ElevenLabs` — ElevenLabs integration project for generated and handwritten provider code

The data layer already exists in `Teleagents.Api/Data/`:

- `TenantModel`, `UserModel`, `AgentModel`, `CallLogModel`
- `RepositoryContext`
- initial EF migration files

Entity Framework Core and PostgreSQL packages are already installed. Tenant ownership is explicit through `TenantId` fields, but tenant scoping is not currently enforced by auth or by global EF query filters.

---

## Architecture Decisions

### Project Structure

We are keeping both `Teleagents.Providers.Abstractions` and `Teleagents.Providers.ElevenLabs` as separate class libraries.

`Teleagents.Providers.ElevenLabs` exists to contain the generated Kiota client and the provider-specific dependency graph away from the API project.

`Teleagents.Providers.Abstractions` exists so the API can depend on Teleagents-owned contracts instead of depending directly on ElevenLabs-specific generated types or concrete provider classes.

Handwritten ElevenLabs adapter logic belongs in `Teleagents.Providers.ElevenLabs`, alongside the generated client, not under `Teleagents.Api`.

### Layering Rule

| Layer | Location | Rule |
|---|---|---|
| Teleagents-owned provider contracts | `Teleagents.Providers.Abstractions/Contracts/` | Stable boundary the API depends on |
| Kiota-generated client | `Teleagents.Providers.ElevenLabs/Generated/` | Never edit manually |
| Handwritten adapter / mapping | `Teleagents.Providers.ElevenLabs/Services/`, `Mapping/` | Wrap generated code and translate provider types |
| Application and domain logic | `Teleagents.Api/` | Must not depend on generated ElevenLabs types directly |

---

## Target Solution Structure

```text
Teleagents/
  .docs/
  specs/
    elevenlabs.openapi.json            ← tracked, used for regeneration
  scripts/
    generate-elevenlabs.sh             ← one-command regeneration
  Teleagents.Server/
    Teleagents.Server.sln
    src/
      Teleagents.Api/
        Data/
          Models/
          RepositoryContext.cs
          Migrations/
        Features/
          Platform/                    ← /api/platform/* endpoints
          Internal/                    ← /api/internal/* endpoints
          Webhooks/                    ← /api/webhooks/elevenlabs
        Program.cs
      Teleagents.Config/
      Teleagents.Providers.Abstractions/
        Contracts/
        Teleagents.Providers.Abstractions.csproj
      Teleagents.Providers.ElevenLabs/
        Generated/                     ← Kiota output, do not touch
        Services/                      ← handwritten wrapper / DI
        Mapping/                       ← type transformation
        Teleagents.Providers.ElevenLabs.csproj
  apps/
    client/                            ← tenant-facing frontend (later)
    console/                           ← staff-facing frontend (later)
```

---

## Phases

### Phase 1 — Data Layer & Database

**Goal:** Wire the existing domain models into EF Core and apply the schema to PostgreSQL.

**Status:** Mostly complete. Models, `RepositoryContext`, and the initial migration exist already.

**Remaining follow-up:**

1. Keep tenant ownership explicit through `TenantId`
2. Enforce tenant scoping later through auth and service-layer query composition instead of global query filters
3. Add a local dev seed workflow once the API surface is a little more stable

**Deliverable:** PostgreSQL schema applied, `RepositoryContext` live, EF migrations tracked in source control.

---

### Phase 2 — Solution Restructure

**Goal:** Get the provider boundary and repo layout ready before adding the ElevenLabs client.

**Status:** Complete enough to proceed.

**Completed steps:**

1. Scaffold `Teleagents.Providers.Abstractions` and `Teleagents.Providers.ElevenLabs`
2. Add project references so the API depends on abstractions and provider projects explicitly
3. Create `Generated/`, `Services/`, and `Mapping/` in the ElevenLabs provider project
4. Create the tracked `specs/` folder for the ElevenLabs OpenAPI document
5. Create `scripts/generate-elevenlabs.sh` placeholder
6. Keep `Teleagents.Server/Teleagents.Server.sln` as the primary server solution

**Deliverable:** Provider boundaries are scaffolded and the repo is ready for SDK generation in the next phase.

---

### Phase 3 — ElevenLabs SDK Generation (Kiota)

**Goal:** Generate a typed .NET client from the ElevenLabs OpenAPI spec and wire a handwritten adapter around it.

**Steps:**

1. Download and store the ElevenLabs OpenAPI spec in `specs/elevenlabs.openapi.json`
2. Install `Microsoft.Kiota` CLI tool
3. Generate the full client into `Teleagents.Providers.ElevenLabs/Generated/` and commit the generated output
4. Flesh out `scripts/generate-elevenlabs.sh` so regeneration is a single command
5. Add handwritten wrapper services in `Teleagents.Providers.ElevenLabs/Services/`
6. Add mapping code in `Teleagents.Providers.ElevenLabs/Mapping/`
7. Register the provider in DI and bind the API key from config

**Deliverable:** Working generated client, handwritten wrapper, repeatable regeneration script. The rest of the app depends only on Teleagents-owned contracts.

---

### Phase 4 — Authentication (WorkOS)

**Goal:** Enforce auth before any real data endpoints are exposed.

Wire WorkOS JWT auth, define tenant vs staff policies, and resolve tenant membership from claims so service-layer queries can be scoped explicitly.

**Steps:**

1. Add WorkOS SDK NuGet package
2. Configure JWT bearer authentication in `Program.cs`
3. Define policies:
   - `TenantUser` — protects `/api/platform/*`
   - `PlatformStaff` — protects `/api/internal/*`
4. Add a small current-user/current-organization abstraction for auth context if needed
5. Apply policies globally per route group
6. Test with a real WorkOS dev org and a test token

**Deliverable:** JWT auth live, route policies in place, and tenant scoping performed explicitly in application code.

---

### Phase 5 — Platform API Endpoints

**Goal:** Build the actual endpoints the client portal and internal console will consume.

**Steps:**

1. **`/api/platform/`** — tenant-scoped read endpoints (DTOs only, no raw entities):
   - `GET /agents` — list agents for the calling tenant
   - `GET /agents/{id}` — agent detail
   - `GET /agents/{id}/calllogs` — call history for an agent
   - `GET /dashboard/stats` — aggregated metrics (total calls, duration, etc.)

2. **`/api/internal/`** — staff-only management endpoints:
   - `POST /tenants` — create a tenant
   - `POST /agents` — attach a provider agent ID to a tenant
   - `PUT /agents/{id}` — update metadata (display name, phone, active flag)

3. **`/api/webhooks/elevenlabs`** — webhook receiver to ingest call data into `CallLog`

**Deliverable:** All V0 backend endpoints functional. Backend is frontend-ready.

---

## Sequencing Summary

```text
Phase 1: DB foundation   ← already largely in place
Phase 2: Restructure     ← scaffolded
Phase 3: ElevenLabs      ← next
Phase 4: Auth            ← after Phase 3 or in parallel once claims model is clear
Phase 5: Endpoints       ← after Phases 3 + 4
```

Frontend apps (`client`, `console`) start after the API and auth shape are stable enough to consume confidently.
