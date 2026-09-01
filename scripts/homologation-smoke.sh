#!/usr/bin/env bash
set -euo pipefail

: "${HOMOLOG_API_URL:?Defina HOMOLOG_API_URL}"
base="${HOMOLOG_API_URL%/}"

for path in /health /ready /metrics; do
  status="$(curl --silent --show-error --output /tmp/quero-internet-smoke-response --write-out '%{http_code}' "${base}${path}")"
  if [[ "$status" != "200" ]]; then
    echo "Falha em ${path}: HTTP ${status}" >&2
    exit 1
  fi
done

echo "Smoke de homologação aprovado: health, ready e metrics responderam HTTP 200."
