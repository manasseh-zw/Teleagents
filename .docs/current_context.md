# Current Context

Minimal snapshot of what’s done, patterns in use, and what’s next. Full conventions live in **patterns.md**; the phased plan is in **plan.server.md**.

---

## Done So Far

### Data & API

- **Solution layout**: `Teleagents.Server/Teleagents.Server.sln` now includes `Teleagents.Api`, `Teleagents.Config`, `Teleagents.Providers.Abstractions`, and `Teleagents.Providers.ElevenLabs`.
- **Data layer**: `Data/RepositoryContext.cs` with `TenantModel`, `UserModel`, `AgentModel`, `CallLogModel`. Fluent config: tables, relationships, indexes. `CallLogModel` has `Transcription` (jsonb, `Transcription` / `CallChatMessage` records), `RawTranscriptPayload` (text), and `CallType` (Inbound/Outbound). Value types like `Transcription` and `CallChatMessage` do **not** use the `Model` suffix.
- **Tenant modeling**: `TenantModel` represents the customer organization. Tenant-owned entities (`User`, `Agent`, `CallLog`) keep explicit `TenantId` foreign keys, but tenant scoping is not enforced through global EF query filters.
- **DI**: `Extensions/ServiceExtensions.cs` — `ConfigureDatabase(connectionString)` and `ConfigureExceptionHandler()`. `Program.cs` only calls these; no inline service registration.
- **Provider scaffolding**: `Teleagents.Providers.Abstractions` and `Teleagents.Providers.ElevenLabs` are scaffolded as class libraries. The ElevenLabs project now has placeholder `Generated/`, `Services/`, and `Mapping/` folders, plus a root `scripts/generate-elevenlabs.sh` stub and `specs/` folder for the tracked OpenAPI document.
- **Result**: `Helpers/Result.cs` — `Result`, `Result<T>`, `IReadOnlyList<string> Errors`, `Bind`; implicit conversions from `T` and `string`; no external libs.
- **API**: Controllers + JSON options: `ReferenceHandler.IgnoreCycles`, `JsonStringEnumConverter`. Global exception handler: `Middleware/GlobalExceptionHandler.cs` implementing `IExceptionHandler`; registered via `AddExceptionHandler<GlobalExceptionHandler>()`; returns ProblemDetails with traceId and logs.
- **Migrations**: The initial EF migration is present and tracked in source control. A local seed script is not scaffolded yet.

---

## Patterns Established

- **One server executable plus support libraries**: `Teleagents.Api` remains the only executable project. Provider abstractions and generated/provider-specific code live in separate class libraries.
- **EF**: Only table-backed entities use the `Model` suffix; value/owned types (e.g. `Transcription`, `CallChatMessage`) do not. DbContext name: `RepositoryContext`. Enums on entities: type name with prefix (e.g. `CallType`, `CallStatus`), property short (e.g. `Type`, `Status`).
- **Services**: Return `Result`/`Result<T>`; no `Async` suffix on method names; interface + impl in same file.
- **Controllers**: Thin; call service, map result to Ok/BadRequest.
- **C# 12**: Collection expressions (`[]`, `[a,b]`) for arrays/lists; no `Array.Empty<T>()` / `new[] { }` where a collection expression fits.
- **Providers**: Generated provider code stays in `Teleagents.Providers.ElevenLabs/Generated/`; handwritten wrapper and mapping code for ElevenLabs live alongside it in that same provider project, not in `Teleagents.Api`.

Details and examples are in **.docs/patterns.md**.

---

## Next Steps (from plan.server.md)

1. **Phase 2 — Solution restructure**: complete enough to proceed. The provider projects, tracked `specs/` folder, and generation script stub are now in place.
2. **Phase 3 — ElevenLabs**: add the ElevenLabs OpenAPI spec, generate the full Kiota client into `Teleagents.Providers.ElevenLabs/Generated/`, then add the handwritten wrapper, mapping, and DI wiring in the same provider project.
3. **Phase 4 — Auth (WorkOS)**: JWT, policies (TenantUser, PlatformStaff), tenant resolution from claims, route policies, and explicit tenant scoping in services/endpoints.
4. **Phase 5 — Endpoints**: Platform read APIs, internal management APIs, and the ElevenLabs webhook receiver.

Frontend (client/console) starts after Phase 5.
