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

## Reconciliação e entrega

Cada webhook aceito cria uma entrada em `BillingDelivery` dentro da mesma transação do evento e da auditoria. O consumidor deve:

1. buscar itens `PENDING` cujo `availableAt` já venceu;
2. reconciliar o pagamento no Asaas antes de produzir efeito de negócio;
3. atualizar o estado normalizado e registrar a tentativa;
4. entregar para o produto pelo contrato versionado;
5. usar backoff limitado para falhas transitórias e marcar falha permanente após o limite.

A entrega deve ser idempotente por `eventId`. O Hub não executa ativação de benefício diretamente.

## Worker de reconciliação

O worker usa `https://api-sandbox.asaas.com/v3` em sandbox e `https://api.asaas.com/v3` em produção. A credencial é enviada somente no header `access_token`; o valor nunca aparece em logs.

A política de retry considera timeout, HTTP 429 e HTTP 5xx como transitórios, com backoff exponencial limitado a cinco tentativas. Erros HTTP 4xx são permanentes até intervenção operacional. O cliente rejeita IDs de pagamento fora do formato permitido e não registra o corpo da resposta do provedor.

## Adaptadores de produto

Quero Internet e LoopClub permanecem sistemas independentes. O Hub entrega eventos por uma allowlist de `productKey`, usando URL e token distintos por produto e ambiente. Nenhum banco ou sessão é compartilhado.

## Receptor interno do Quero Internet

O endpoint `POST /internal/billing/events` não é o webhook do Asaas. Ele exige `BILLING_INTERNAL_TOKEN`, o cabeçalho `x-billing-event-id`, o `productKey` `quero-internet` e o ambiente correto.

O webhook público sempre grava o evento como `PENDING_RECONCILIATION`. O receptor interno rejeita esse estado. Somente após consulta bem-sucedida ao Asaas o worker poderá promover o evento e entregá-lo ao produto. Eventos já entregues retornam confirmação idempotente.
