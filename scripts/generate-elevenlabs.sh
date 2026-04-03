#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_PATH="$ROOT_DIR/specs/elevenlabs.openapi.json"
OUTPUT_DIR="$ROOT_DIR/Teleagents.Server/src/Teleagents.Providers.ElevenLabs/Generated"
TMP_SPEC="/tmp/elevenlabs.kiota.conversations.json"
KIOTA_BIN="${KIOTA_BIN:-}"

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "Missing ElevenLabs spec at $SPEC_PATH"
  echo "Add the OpenAPI document first, then rerun generation."
  exit 1
fi

if [[ -z "$KIOTA_BIN" ]]; then
  if command -v kiota >/dev/null 2>&1; then
    KIOTA_BIN="$(command -v kiota)"
  else
    KIOTA_BIN="$HOME/.dotnet/tools/kiota"
  fi
fi

if [[ ! -x "$KIOTA_BIN" ]]; then
  echo "Kiota executable not found."
  echo "Set KIOTA_BIN explicitly or install the global tool so '$KIOTA_BIN' exists."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to prepare the ElevenLabs spec for Kiota generation."
  exit 1
fi

python3 -m json.tool "$SPEC_PATH" >/dev/null

# The upstream ElevenLabs spec contains a few shapes Kiota 1.30 does not
# currently handle. We normalize those on a temp copy so the tracked spec stays
# untouched and regeneration remains repeatable across upstream updates.
jq '
  del(
    .components.schemas["AgentDeploymentRequestItem"].properties.deployment_strategy.discriminator,
    .components.schemas["AgentPlatformSettingsRequestModel"].properties.guardrails.discriminator,
    .components.schemas["AgentPlatformSettingsResponseModel"].properties.guardrails.discriminator,
    .components.schemas["TTSOptimizeStreamingLatency"]
  )
  | .components.schemas["SupportedVoice"].properties.optimize_streaming_latency.anyOf[0] = {"type":"integer"}
  | .components.schemas["TTSConversationalConfig-Input"].properties.optimize_streaming_latency.type = "integer"
  | del(.components.schemas["TTSConversationalConfig-Input"].properties.optimize_streaming_latency["$ref"])
  | .components.schemas["TTSConversationalConfig-Output"].properties.optimize_streaming_latency.type = "integer"
  | del(.components.schemas["TTSConversationalConfig-Output"].properties.optimize_streaming_latency["$ref"])
  | .components.schemas["TTSConversationalConfigWorkflowOverride-Input"].properties.optimize_streaming_latency.anyOf[0] = {"type":"integer"}
  | .components.schemas["TTSConversationalConfigWorkflowOverride-Output"].properties.optimize_streaming_latency.anyOf[0] = {"type":"integer"}
' "$SPEC_PATH" > "$TMP_SPEC"

echo "Generating ElevenLabs client with Kiota"
echo "Source spec: $SPEC_PATH"
echo "Temp spec:   $TMP_SPEC"
echo "Output:      $OUTPUT_DIR"
echo "Paths:"
echo "  - /v1/convai/conversations"
echo "  - /v1/convai/conversations/{conversation_id}"
echo "  - /v1/convai/conversations/{conversation_id}/audio"

"$KIOTA_BIN" generate \
  -l CSharp \
  -d "$TMP_SPEC" \
  -o "$OUTPUT_DIR" \
  -c ElevenLabsApiClient \
  -n Teleagents.Providers.ElevenLabs.Generated \
  --clean-output \
  --exclude-backward-compatible \
  --include-path "/v1/convai/conversations" \
  --include-path "/v1/convai/conversations/{conversation_id}" \
  --include-path "/v1/convai/conversations/{conversation_id}/audio"
