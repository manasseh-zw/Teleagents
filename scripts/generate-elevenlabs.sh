#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_PATH="$ROOT_DIR/specs/elevenlabs.openapi.json"
OUTPUT_DIR="$ROOT_DIR/Teleagents.Server/src/Teleagents.Providers.ElevenLabs/Generated"

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "Missing ElevenLabs spec at $SPEC_PATH"
  echo "Add the OpenAPI document first, then rerun generation."
  exit 1
fi

echo "Kiota generation is not wired up yet."
echo "Spec:   $SPEC_PATH"
echo "Output: $OUTPUT_DIR"
echo
echo "Next step: add the Kiota generate command here once the spec and package choices are finalized."
