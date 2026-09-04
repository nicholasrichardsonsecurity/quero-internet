#!/usr/bin/env bash
set -euo pipefail

: "${ASAAS_WEBHOOK_TOKEN:?Defina ASAAS_WEBHOOK_TOKEN}"
: "${BILLING_BASE_URL:=https://api.aplivora.com.br}"
: "${BILLING_EVENT_ID:=evt-sandbox-smoke-001}"

curl --fail-with-body --silent --show-error \
  -X POST "${BILLING_BASE_URL}/billing/webhooks/asaas" \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: ${ASAAS_WEBHOOK_TOKEN}" \
  --data-binary @- <<JSON
{"id":"${BILLING_EVENT_ID}","event":"PAYMENT_RECEIVED","payment":{"id":"payment-smoke-001","status":"RECEIVED","externalReference":"aplivora:v1:quero-internet:tenant-smoke:company-smoke:plan-smoke:payment-smoke-001"}}
JSON
