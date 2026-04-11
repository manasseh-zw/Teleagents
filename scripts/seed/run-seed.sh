#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_FILE="${1:-$ROOT_DIR/scripts/seed/default-cbz.sql}"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Seed SQL file not found: $SQL_FILE"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run the seed."
  exit 1
fi

resolve_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    printf '%s' "$DATABASE_URL"
    return
  fi

  local env_candidates=(
    "$ROOT_DIR/.env"
    "$ROOT_DIR/Teleagents.Server/src/Teleagents.Api/.env"
  )

  local env_file
  for env_file in "${env_candidates[@]}"; do
    if [[ -f "$env_file" ]]; then
      local value
      value="$(grep -E '^DATABASE_URL=' "$env_file" | tail -n 1 | cut -d= -f2- || true)"
      if [[ -n "$value" ]]; then
        printf '%s' "$value"
        return
      fi
    fi
  done
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

strip_wrapping_quotes() {
  local value="$1"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

run_psql() {
  local connection_value="$1"

  if [[ "$connection_value" == postgres://* || "$connection_value" == postgresql://* ]]; then
    psql "$connection_value" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
    return
  fi

  local host=""
  local port=""
  local database=""
  local username=""
  local password=""

  IFS=';' read -r -a parts <<< "$connection_value"

  local part
  for part in "${parts[@]}"; do
    part="$(trim "$part")"
    [[ -z "$part" ]] && continue

    local key="${part%%=*}"
    local value="${part#*=}"

    key="$(trim "$key")"
    value="$(trim "$value")"

    case "$key" in
      Host)
        host="$value"
        ;;
      Port)
        port="$value"
        ;;
      Database)
        database="$value"
        ;;
      Username|User\ ID|UserID)
        username="$value"
        ;;
      Password)
        password="$value"
        ;;
    esac
  done

  if [[ -z "$host" || -z "$database" || -z "$username" ]]; then
    echo "DATABASE_URL is missing one of Host, Database, or Username."
    exit 1
  fi

  local psql_args=(
    -h "$host"
    -U "$username"
    -d "$database"
    -v ON_ERROR_STOP=1
    -f "$SQL_FILE"
  )

  if [[ -n "$port" ]]; then
    psql_args=(-h "$host" -p "$port" -U "$username" -d "$database" -v ON_ERROR_STOP=1 -f "$SQL_FILE")
  fi

  PGPASSWORD="$password" psql "${psql_args[@]}"
}

DATABASE_URL_VALUE="$(resolve_database_url)"
DATABASE_URL_VALUE="$(strip_wrapping_quotes "$DATABASE_URL_VALUE")"

if [[ -z "$DATABASE_URL_VALUE" ]]; then
  echo "DATABASE_URL is not set."
  echo "Set it in your shell or add it to .env at the repo root."
  exit 1
fi

echo "Running seed: $SQL_FILE"
run_psql "$DATABASE_URL_VALUE"
echo "Seed completed successfully."
