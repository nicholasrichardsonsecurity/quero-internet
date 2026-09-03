# Observabilidade

## Objetivo

A API deve produzir sinais operacionais úteis sem expor tokens, cookies, documentos ou dados pessoais.

## Baseline atual

- x-request-id e x-correlation-id são propagados em cada resposta.
- Identificadores recebidos são aceitos somente com caracteres seguros e limite de 128 caracteres.
- /metrics expõe contadores agregados, classes de status, duração média e uptime.
- Logs HTTP são estruturados em JSON e não registram corpo, query string ou cabeçalhos de autenticação.
- Falhas de infraestrutura devem permanecer fail-closed e ser investigadas pelos logs do serviço.

## Vendors opcionais

OpenTelemetry é o padrão de instrumentação vendor-neutral. Sentry, Datadog e New Relic devem ser adapters opcionais por ambiente. Nenhum vendor pode ser requisito para a API iniciar.

Antes de habilitar um destino externo:

1. redigir tokens, cookies, Authorization, CPF, documentos e payloads;
2. definir retenção e controle de acesso;
3. validar custo, amostragem e região de processamento;
4. testar desligamento sem alteração no domínio.

## Validação

    pnpm --filter @quero-internet/api test
    pnpm --filter @quero-internet/api typecheck
    curl http://127.0.0.1:3001/metrics

O endpoint de métricas deve ser protegido ou exposto somente em rede administrativa antes de produção.
