# Current Context

Minimal snapshot of what’s done, patterns in use, and what’s next. Full conventions live in **patterns.md**; the phased plan is in **plan.server.md**.

---

## Done So Far

### Data & API

- **Teleagents.Api** + **Teleagents.Config**: Single Web API project; config reads `DATABASE_URL` from env (dotenv in Development).
- **Data layer**: `Data/RepositoryContext.cs` with `TenantModel`, `UserModel`, `AgentModel`, `CallLogModel`. Fluent config: tables, relationships, indexes. `CallLogModel` has `Transcription` (jsonb, `Transcription` / `CallChatMessage` records), `RawTranscriptPayload` (text), and `CallType` (Inbound/Outbound). Value types like `Transcription` and `CallChatMessage` do **not** use the `Model` suffix.
- **Multi-tenant**: `Helpers/TenantContext.cs` (`ITenantContext`, `TenantId`). Global query filters on `User`, `Agent`, `CallLog` by `TenantId` in `RepositoryContext`; when `TenantId` is null (e.g. before auth), filters do not restrict.
- **DI**: `Extensions/ServiceExtensions.cs` — `ConfigureDatabase(connectionString)` and `ConfigureExceptionHandler()`. `Program.cs` only calls these; no inline service registration.
- **Result**: `Helpers/Result.cs` — `Result`, `Result<T>`, `IReadOnlyList<string> Errors`, `Bind`; implicit conversions from `T` and `string`; no external libs.
- **API**: Controllers + JSON options: `ReferenceHandler.IgnoreCycles`, `JsonStringEnumConverter`. Global exception handler: `Middleware/GlobalExceptionHandler.cs` implementing `IExceptionHandler`; registered via `AddExceptionHandler<GlobalExceptionHandler>()`; returns ProblemDetails with traceId and logs.
- **Migrations**: Applied via `dotnet ef` (no script). **Seed**: single-file script `scripts/seed.cs` using `#:project` to reference the API; builds a small host, resolves `RepositoryContext`, runs `Scripts/SeedRunner.RunAsync(db)`. Run from repo root: `dotnet run scripts/seed.cs`. Seed logic lives in `Teleagents.Api/Scripts/SeedRunner.cs` (one tenant, one user, one agent; skips if any tenant exists).

---

## Patterns Established

- **One server project**, organized by concern; domains in flat folders under `Domains/{DomainName}/`.
- **EF**: Only table-backed entities use the `Model` suffix; value/owned types (e.g. `Transcription`, `CallChatMessage`) do not. DbContext name: `RepositoryContext`. Enums on entities: type name with prefix (e.g. `CallType`, `CallStatus`), property short (e.g. `Type`, `Status`).
- **Services**: Return `Result`/`Result<T>`; no `Async` suffix on method names; interface + impl in same file.
- **Controllers**: Thin; call service, map result to Ok/BadRequest.
- **C# 12**: Collection expressions (`[]`, `[a,b]`) for arrays/lists; no `Array.Empty<T>()` / `new[] { }` where a collection expression fits.
- **Scripts**: .NET 10 single-file; `#:project` to reference the API for seed (no change to `Program.cs`).

Details and examples are in **.docs/patterns.md**.

---

## Next Steps (from plan.server.md)

1. **Phase 2 — Solution restructure**: Add `Teleagents.Providers.ElevenLabs` project, `Integrations/ElevenLabs/`, align folders with target layout (`Features/Platform`, `Internal`, `Webhooks`), add `specs/` and `scripts/generate-elevenlabs.sh` placeholder.
2. **Phase 3 — ElevenLabs**: OpenAPI spec, Kiota client in `Generated/`, handwritten wrapper and mapping in `Integrations/ElevenLabs/`, DI and config.
3. **Phase 4 — Auth (WorkOS)**: JWT, policies (TenantUser, PlatformStaff), `TenantContext` populated from claims, route policies.
4. **Phase 5 — Endpoints**: Platform read APIs, internal management APIs, webhook for ElevenLabs call data.

Frontend (client/console) starts after Phase 5.
