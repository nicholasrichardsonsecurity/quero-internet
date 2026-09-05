# Worker de billing em homologação

Este runbook publica o worker de reconciliação Asaas sem expor secrets no Git.

## Pré-requisitos

- API Quero Internet saudável em `127.0.0.1:3001`;
- `BILLING_INTERNAL_TOKEN` idêntico na API e no worker;
- `ASAAS_API_KEY` configurada na API;
- `ASAAS_BASE_URL=https://api-sandbox.asaas.com`;
- Docker e acesso ao repositório.

## Build

Na raiz do repositório:

```bash
docker build -f apps/worker/Dockerfile -t quero-internet-worker:homolog .
```

## Arquivo local de secrets

```bash
install -m 600 /dev/null /opt/quero-internet/worker-homolog.env
nano /opt/quero-internet/worker-homolog.env
```

Conteúdo mínimo:

```dotenv
BILLING_RECONCILIATION_URL=http://127.0.0.1:3001/internal/billing/reconcile/run
BILLING_INTERNAL_TOKEN=valor-compartilhado-com-a-api
BILLING_RECONCILIATION_INTERVAL_MS=60000
BILLING_RECONCILIATION_BATCH_SIZE=25
```

Não cole esse arquivo em Issues, PRs, logs ou mensagens.

## Deploy

```bash
docker rm -f quero-internet-worker-homolog 2>/dev/null || true

docker run -d \
  --name quero-internet-worker-homolog \
  --network host \
  --restart unless-stopped \
  --env-file /opt/quero-internet/worker-homolog.env \
  quero-internet-worker:homolog
```

## Validação

```bash
docker ps --filter name=quero-internet-worker-homolog
docker logs --tail 100 quero-internet-worker-homolog
curl -sS https://api.aplivora.com.br/metrics
curl -sS https://api.aplivora.com.br/ready
```

O log esperado contém `worker_started` e, após cada ciclo, `reconciliation_completed`. Falhas devem aparecer como `reconciliation_failed`, sem imprimir token ou payload.

## Rollback

```bash
docker rm -f quero-internet-worker-homolog
```

O rollback do worker não altera dados já reconciliados; eventos pendentes permanecem disponíveis para reprocessamento após a correção.
