# Current Context

Short handoff for the next session.

## Current State

- The main server solution is [Teleagents.Server.sln](/Users/manasseh/Projects/next/teleagents/main/Teleagents/Teleagents.Server/Teleagents.Server.sln).
- The solution now includes:
  - `Teleagents.Api`
  - `Teleagents.Config`
  - `Teleagents.Providers.Abstractions`
  - `Teleagents.Providers.ElevenLabs`
- `Teleagents.Api` references both provider projects.
- Tenant ownership stays explicit through `TenantId` fields on tenant-owned entities.
- The old ambient tenant-context/global query-filter pattern has been removed.

## What Was Done

- Scaffolded `Teleagents.Providers.Abstractions` with [IVoiceProviderService.cs](/Users/manasseh/Projects/next/teleagents/main/Teleagents/Teleagents.Server/src/Teleagents.Providers.Abstractions/Contracts/IVoiceProviderService.cs).
- Scaffolded `Teleagents.Providers.ElevenLabs` with provider folders:
  - [Generated](/Users/manasseh/Projects/next/teleagents/main/Teleagents/Teleagents.Server/src/Teleagents.Providers.ElevenLabs/Generated)
  - [Services]( /Users/manasseh/Projects/next/teleagents/main/Teleagents/Teleagents.Server/src/Teleagents.Providers.ElevenLabs/Services/README.md)
  - [Mapping]( /Users/manasseh/Projects/next/teleagents/main/Teleagents/Teleagents.Server/src/Teleagents.Providers.ElevenLabs/Mapping/README.md)
- Added the spec location [specs/elevenlabs.openapi.json](/Users/manasseh/Projects/next/teleagents/main/Teleagents/specs/elevenlabs.openapi.json) using the official `https://api.elevenlabs.io/openapi.json` source.
- Replaced the generation stub with a working [scripts/generate-elevenlabs.sh](/Users/manasseh/Projects/next/teleagents/main/Teleagents/scripts/generate-elevenlabs.sh) workflow that:
  - normalizes the upstream spec into a temporary Kiota-friendly copy
  - defaults to a narrow ConvAI conversation scope
  - allows extra include paths to be passed explicitly when expanding scope later
- Generated the first working Kiota client slice into [Generated](/Users/manasseh/Projects/next/teleagents/main/Teleagents/Teleagents.Server/src/Teleagents.Providers.ElevenLabs/Generated) for:
  - `/v1/convai/conversations`
  - `/v1/convai/conversations/{conversation_id}`
  - `/v1/convai/conversations/{conversation_id}/audio`
- Added the Kiota runtime bundle dependency to [Teleagents.Providers.ElevenLabs.csproj](/Users/manasseh/Projects/next/teleagents/main/Teleagents/Teleagents.Server/src/Teleagents.Providers.ElevenLabs/Teleagents.Providers.ElevenLabs.csproj).

## Active Direction

- Keep the ElevenLabs generated client inside `Teleagents.Providers.ElevenLabs`.
- Keep the generated surface intentionally narrow and add more `--include-path` entries only as provider features require them.
- Keep handwritten wrapper and mapping code in that same provider project.
- Keep `Teleagents.Api` depending on Teleagents-owned abstractions, not generated ElevenLabs types directly.

## Next Session

- Restore/build the provider project after the new Kiota bundle package is available locally.
- Add the first handwritten wrapper around the generated conversation endpoints.
- Decide whether V0 also needs agent listing/details and outbound calling include paths before expanding generation scope.
- Then wire provider registration into API DI.
