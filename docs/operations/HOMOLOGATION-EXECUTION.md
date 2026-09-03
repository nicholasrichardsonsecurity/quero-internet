# Execução da homologação

Este runbook descreve uma homologação isolada, reproduzível e sem dados reais. O guia de instalação complementar está em [`INSTALLATION.md`](INSTALLATION.md).

## Pré-requisitos

- host com Node.js 22.x, pnpm 10.14.x, Docker e OpenSSL;
- acesso ao repositório e ao secret manager, quando houver;
- rede autorizada para a API e para o banco de homologação;
- backup e procedimento de restauração testáveis.

## Preparação do secret local

```bash
cd /opt/quero-internet/quero-internet
cp infra/docker/.env.homolog.example infra/docker/.env.homolog.local
```

Substitua todos os placeholders por valores aleatórios e mantenha o arquivo fora do Git:

```bash
chmod 600 infra/docker/.env.homolog.local
set -a; . infra/docker/.env.homolog.local; set +a
bash scripts/verify-homologation-config.sh
```

Não registre o conteúdo do arquivo, secrets, cookies ou tokens em logs, screenshots ou evidências.

## Subir a infraestrutura

```bash
docker compose --env-file infra/docker/.env.homolog.local -f infra/docker/docker-compose.homolog.yml up -d postgres redis minio
docker compose --env-file infra/docker/.env.homolog.local -f infra/docker/docker-compose.homolog.yml ps
```

O compose de homologação usa a rede interna `homolog_internal`, volumes próprios e não publica PostgreSQL, Redis ou MinIO no host. A API deve entrar nessa rede por um mecanismo controlado do ambiente de hospedagem.

Não reutilize o compose, volumes, rede ou portas de outro produto. Em especial, não altere containers ou recursos do LoopClub.

## Migrations

Defina `DATABASE_URL` apontando para o serviço `postgres` da rede interna e execute:

```bash
DATABASE_URL="postgresql://${HOMOLOG_POSTGRES_USER}:${HOMOLOG_POSTGRES_PASSWORD}@postgres:5432/${HOMOLOG_POSTGRES_DB}" pnpm db:migrate:deploy
```

Confirme que todas as migrations foram aplicadas antes de iniciar a API. Em um host sem acesso direto à rede Docker, use um túnel/proxy administrativo temporário, restrito a `127.0.0.1`, e remova-o ao terminar.

## Seed sintético e smoke

```bash
APP_ENV=homolog ALLOW_SYNTHETIC_SEED=true pnpm --filter @quero-internet/database db:seed:homolog
HOMOLOG_API_URL=https://homolog.example scripts/homologation-smoke.sh
```

O seed é exclusivo para homologação. O smoke mínimo exige HTTP 200 em `/health`, `/ready` e `/metrics`.

Depois execute o fluxo descrito em [`E2E-SMOKE-SPEC.md`](E2E-SMOKE-SPEC.md), incluindo casos negativos, tentativa de acesso cruzado entre tenants e reexecução com a mesma chave de idempotência.

## Evidências

Registre:

- commit e versão candidata;
- digest das imagens;
- horário, executor e dataset sintético;
- estado de health/readiness;
- request/correlation IDs;
- resultado dos testes, falhas e ações corretivas;
- backup/restore e plano de rollback.

Não registre secrets, `Authorization`, cookies, documentos brutos, payloads pessoais ou dados de produção.

## Critérios de saída

1. infraestrutura saudável e isolada;
2. migrations reproduzíveis;
3. API acessível somente por rota autorizada;
4. seed e E2E executados com dados sintéticos;
5. logs sanitizados;
6. backup/restore validado;
7. rollback da candidata testado ou explicitamente bloqueado;
8. evidências anexadas ao registro do gate.

Homologação técnica concluída não equivale a aprovação de piloto público ou produção.

## Encerramento

```bash
docker compose --env-file infra/docker/.env.homolog.local -f infra/docker/docker-compose.homolog.yml down
```

Esse comando preserva os volumes. Não use `down -v` sem uma decisão operacional explícita, pois ele remove os dados do ambiente.