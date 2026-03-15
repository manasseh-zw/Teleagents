# TeleAgents Server — Backend Execution Plan (V0)

## Current State

The solution contains two .NET projects:

- `Teleagents.Api` — ASP.NET Core Web API (stock template, weather stub)
- `Teleagents.Config` — Config loader using `dotenv.net` to read `DATABASE_URL` from `.env`

Domain models are already drafted in `Teleagents.Api/Data/Models/`:

- `TenantModel`, `UserModel`, `AgentModel`, `CallLogModel`

No packages beyond the bare template are installed. No database, auth, or real endpoints yet.

---

## Architecture Decisions

### Project Structure

We are **not** creating `Teleagents.Providers.Abstractions` for V0. There is one provider (ElevenLabs). Abstracting over one concrete thing is premature at this stage.

We **are** keeping `Teleagents.Providers.ElevenLabs` as a separate `.csproj`. This is justified purely by the Kiota-generated code — the generation produces many files with its own `Microsoft.Kiota.*` dependency tree. Containing it in its own project keeps regeneration clean and prevents generated files from polluting `Teleagents.Api`.

Handwritten integration logic sits inside `Teleagents.Api` under `Integrations/ElevenLabs/`, not inside the generated project.

### Layering Rule

| Layer | Location | Rule |
|---|---|---|
| Kiota-generated client | `Teleagents.Providers.ElevenLabs/Generated/` | Never edit manually |
| Handwritten adapter / mapping | `Teleagents.Api/Integrations/ElevenLabs/` | All business logic, mapping, config here |
| Provider abstraction interface | ❌ — skip for V0 | Introduce when a second provider exists |

---

## Target Solution Structure

```
Teleagents/
  Teleagents.sln
  .docs/
  specs/
    elevenlabs.openapi.json          ← tracked, used for regeneration
  scripts/
    generate-elevenlabs.sh           ← one-command regeneration
  src/
    server/
      Teleagents.Api/
        Data/
          Models/
          AppDbContext.cs
          Migrations/
        Integrations/
          ElevenLabs/
            ElevenLabsClient.cs      ← your handwritten wrapper
            ElevenLabsMapping.cs     ← type transformation
            ElevenLabsOptions.cs     ← config binding
        Features/
          Platform/                  ← /api/platform/* endpoints
          Internal/                  ← /api/internal/* endpoints
          Webhooks/                  ← /api/webhooks/elevenlabs
        Program.cs
      Teleagents.Config/
      Teleagents.Providers.ElevenLabs/
        Generated/                   ← Kiota output, do not touch
        Teleagents.Providers.ElevenLabs.csproj
  apps/
    client/                          ← tenant-facing frontend (later)
    console/                         ← staff-facing frontend (later)
```

---

## Phases

### Phase 1 — Data Layer & Database

**Goal:** Wire the existing domain models into EF Core and apply the schema to PostgreSQL.

Nothing else proceeds meaningfully without a real database. Auth needs `User`/`Tenant`. The ElevenLabs integration needs `Agent` records to map against. All endpoints need the DB.

**Steps:**

1. Add EF Core + Npgsql NuGet packages to `Teleagents.Api`
2. Create `AppDbContext` — register all four models
3. Apply `CallLog → Tenant` relationship with `DeleteBehavior.NoAction` (avoids multiple cascade path error)
4. Add global query filters for multi-tenant isolation on `Agent`, `User`, and `CallLog` by `TenantId`
5. Wire `AppDbContext` into `Program.cs` using the `DATABASE_URL` from `Teleagents.Config`
6. Run initial migration and apply to the database
7. Add a local dev seeder — one test tenant, one test agent

**Deliverable:** PostgreSQL schema applied, `AppDbContext` live, EF migrations tracked in source control.

---

### Phase 2 — Solution Restructure

**Goal:** Get the project layout matching the target structure before adding more code.

**Steps:**

1. Create `Teleagents.Providers.ElevenLabs` project (empty for now — just the `.csproj` and `Generated/` placeholder)
2. Reference it from `Teleagents.Api`
3. Create the `Integrations/ElevenLabs/` folder structure in `Teleagents.Api`
4. Rename / reorganise the solution file to match the target layout if needed
5. Create the `specs/` folder for the ElevenLabs OpenAPI spec (committed to source control)
6. Create `scripts/generate-elevenlabs.sh` placeholder

**Deliverable:** Solution structure matches the target layout. Ready for SDK generation in the next phase.

---

### Phase 3 — ElevenLabs SDK Generation (Kiota)

**Goal:** Generate a typed .NET client from the ElevenLabs OpenAPI spec and wire a handwritten adapter around it.

Do this after the DB is real so you have concrete types to map against when writing the adapter.

**Steps:**

1. Download and store the ElevenLabs OpenAPI spec in `specs/elevenlabs.openapi.json`
2. Install `Microsoft.Kiota` CLI tool
3. Generate the client into `Teleagents.Providers.ElevenLabs/Generated/` — commit the generated output
4. Flesh out `scripts/generate-elevenlabs.sh` so regeneration is a single command
5. Write `ElevenLabsClient.cs` in `Integrations/ElevenLabs/` — wraps the generated client, handles auth headers, exposes only what the application needs
6. Write `ElevenLabsMapping.cs` — transforms generated types into internal DTOs
7. Register in DI, bind the API key from config

**Deliverable:** Working generated client, handwritten wrapper, repeatable regeneration script. The rest of the app never imports from `Generated/` directly.

---

### Phase 4 — Authentication (WorkOS)

**Goal:** Enforce auth before any real data endpoints are exposed.

Wire WorkOS JWT auth, define tenant vs staff policies, and extract the `TenantId` claim into a scoped service so all downstream queries are automatically tenant-scoped.

**Steps:**

1. Add WorkOS SDK NuGet package
2. Configure JWT bearer authentication in `Program.cs`
3. Define policies:
   - `TenantUser` — protects `/api/platform/*`
   - `PlatformStaff` — protects `/api/internal/*`
4. Create a `TenantContext` service — extracts `TenantId` from the JWT claim, used by all read queries
5. Apply policies globally per route group
6. Test with a real WorkOS dev org and a test token

**Deliverable:** JWT auth live, tenant isolation enforced at the auth layer, route policies in place.

---

### Phase 5 — Platform API Endpoints

**Goal:** Build the actual endpoints the client portal and internal console will consume.

Auth is enforced, the DB is real, the ElevenLabs adapter exists. This phase makes the backend a callable product.

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

```
Phase 1: DB            ← start here
Phase 2: Restructure   ← can run alongside Phase 1
Phase 3: ElevenLabs    ← after Phase 1 (needs real model types)
Phase 4: Auth          ← after Phase 1 (needs User/Tenant in DB)
Phase 5: Endpoints     ← after Phases 3 + 4
```

Frontend apps (`client`, `console`) are not started until Phase 5 is complete and the API is stable.
