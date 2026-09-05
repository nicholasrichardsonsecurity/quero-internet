# Reconciliação de pagamentos Asaas

O webhook público apenas registra o evento como `PENDING_RECONCILIATION`. Ele não ativa benefício, assinatura ou entrega de produto.

## Execução

A reconciliação é exposta como uma operação de lote por `BillingReconciliationService.runOnce(limit)`. Um scheduler/runner deve chamar essa operação com limite controlado, por exemplo a cada minuto.

A operação:

1. seleciona eventos pendentes por ordem de recebimento;
2. faz claim condicional para evitar dois workers processarem o mesmo evento;
3. consulta `GET /v3/payments/:paymentId` no ambiente Asaas configurado;
4. promove apenas estados confirmados;
5. chama o receptor interno idempotente;
6. aplica retry exponencial limitado para falhas transitórias.

## Configuração

- `ASAAS_API_KEY`: chave do ambiente correspondente;
- `ASAAS_BASE_URL`: por padrão `https://api-sandbox.asaas.com`;
- `BILLING_INTERNAL_TOKEN`: token do receptor interno;
- `NODE_ENV`: define sandbox ou production no contrato interno.

Nunca registrar a chave Asaas, payload integral, documento de beneficiário ou dados de cartão nos logs.

## Estados

Eventos `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED` só promovem para `PAID` quando o pagamento consultado está `RECEIVED` ou `CONFIRMED`. Eventos de estorno, chargeback, atraso, exclusão e restauração usam a allowlist definida pelo receptor interno.

Pagamentos ainda pendentes permanecem em `PENDING_RECONCILIATION` com `nextAttemptAt` e erro sanitizado. A entrega só é considerada concluída quando o receptor interno confirma o evento.
