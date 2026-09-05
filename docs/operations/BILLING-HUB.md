# Billing Hub Aplivora

O Billing Hub centraliza a integração com o Asaas para os produtos Aplivora.

## Contrato

- Uma chave API por ambiente: Sandbox e Produção têm chaves separadas.
- Um webhook por ambiente: `POST https://api.aplivora.com.br/billing/webhooks/asaas`.
- Os produtos usam `productKey`: `loopclub`, `meu-cond`, `taplink` ou `quero-internet`.
- O endpoint de criação é interno: `POST /billing/charges`, protegido por `BILLING_INTERNAL_TOKEN`.
- Produtos não recebem a chave Asaas nem chamam o Asaas diretamente.

## Criar cobrança

Exemplo de payload:

```json
{
  "idempotencyKey": "loopclub-checkout-001",
  "productKey": "loopclub",
  "tenantId": "tenant-1",
  "companyId": "company-1",
  "planId": "pro",
  "customerId": "cus_000009025596",
  "value": 29.90,
  "billingType": "PIX",
  "dueDate": "2026-09-10",
  "description": "LoopClub Pro"
}
```

A API gera uma referência antes de chamar o Asaas:

`aplivora:v1:{productKey}:{tenantId}:{companyId}:{planId}:{internalPaymentReference}`

O ID retornado pelo Asaas é salvo separadamente. Isso evita a circularidade de tentar usar um ID que só existe depois da criação da cobrança. Repetir o mesmo `idempotencyKey` retorna a cobrança já criada sem duplicar o pagamento.

## Webhook e reconciliação

O webhook valida `asaas-access-token`, grava o evento de forma idempotente e coloca a entrega em reconciliação. O worker consulta o pagamento pelo ID real do Asaas antes de entregar o estado ao produto. O retorno do navegador nunca confirma pagamento.

## Quero Internet GovTech

No MVP GovTech, a prefeitura paga o provedor diretamente. O Billing Hub registra cobrança, elegibilidade, medição e auditoria; não faz repasse de verba pública por conta própria.
