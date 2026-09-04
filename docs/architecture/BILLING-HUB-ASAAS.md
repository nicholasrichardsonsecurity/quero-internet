# Billing Hub Aplivora + Asaas

## Endpoint
O endpoint canônico é https://api.aplivora.com.br/billing/webhooks/asaas.
No futuro pode existir billing.aplivora.com.br, mas o contrato permanece versionado.

## Referência obrigatória
aplivora:v1:<productKey>:<tenantId>:<companyId>:<planId>:<paymentId>

O Hub separa produto, tenant, empresa, plano e ambiente. O callback do navegador não confirma pagamento e nunca ativa serviço.

## Controles aplicados
- validação do header asaas-access-token com ASAAS_WEBHOOK_TOKEN;
- sandbox e produção separados por NODE_ENV e segredo próprio;
- eventos conhecidos e pagamento compatível com externalReference;
- deduplicação por eventId com restrição única no PostgreSQL;
- hash SHA-256 e registro de auditoria sem dados sensíveis em logs;
- resposta 200 idempotente para reentrega já registrada;
- este primeiro corte registra para reconciliação; ativação, estorno, chargeback, vencimento e cancelamento devem consumir o evento auditado.

## Operação
Configure ASAAS_WEBHOOK_TOKEN por ambiente e aplique pnpm db:migrate:deploy. Nunca versione ou imprima o token.
