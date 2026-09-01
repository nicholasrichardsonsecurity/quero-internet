#!/usr/bin/env bash
set -euo pipefail

compose_file="infra/docker/docker-compose.homolog.yml"
required_vars=(
  HOMOLOG_POSTGRES_DB
  HOMOLOG_POSTGRES_USER
  HOMOLOG_POSTGRES_PASSWORD
  HOMOLOG_REDIS_PASSWORD
  HOMOLOG_MINIO_ROOT_USER
  HOMOLOG_MINIO_ROOT_PASSWORD
)

if [[ ! -f "$compose_file" ]]; then
  echo "Arquivo de homologação ausente: $compose_file" >&2
  exit 1
fi

for variable in "${required_vars[@]}"; do
  value="${!variable:-}"
  if [[ -z "$value" || "$value" == *REPLACE_WITH* || "$value" == "change_me" ]]; then
    echo "Variável ausente ou insegura: $variable" >&2
    exit 1
  fi
done

docker compose --env-file infra/docker/.env.homolog.local -f "$compose_file" config --quiet
echo "Configuração de homologação válida; serviços não foram iniciados."
