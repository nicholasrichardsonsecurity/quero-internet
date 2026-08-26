# Beneficiários e Solicitações — Missão 1.2

## Escopo inicial

O contexto municipal mantém o cadastro mínimo necessário do cidadão e suas solicitações a programas públicos de conectividade.

## Regras de isolamento

- Beneficiário pertence obrigatoriamente a um tenant e a uma organização municipal.
- Solicitação pertence ao mesmo tenant e município do beneficiário e do programa.
- O cadastro municipal completo de beneficiários não é exposto a provedores nesta fase.
- Acesso de provedor a dados de cidadão somente será criado quando houver encaminhamento/atribuição explícita e escopo mínimo necessário.

## Privacidade

- O documento bruto é aceito apenas na entrada da operação e não é persistido.
- A deduplicação utiliza HMAC-SHA256 com `BENEFICIARY_IDENTITY_PEPPER`, armazenado fora do código e do banco.
- Apenas os quatro últimos dígitos ficam disponíveis para identificação operacional.
- AuditLog registra IDs técnicos e eventos, não o documento bruto.

## Fluxo inicial

1. operador/gestor municipal cadastra beneficiário;
2. sistema valida contexto municipal e tenant;
3. sistema cria solicitação somente para programa ativo do mesmo município/tenant;
4. solicitação nasce como `SUBMITTED`;
5. análise de elegibilidade e encaminhamento ao provedor serão implementados nos próximos gates.

## Limites atuais

- Sem decisão automatizada de elegibilidade.
- Sem encaminhamento para provedor.
- Sem anexos/documentos comprobatórios.
- Sem paginação por cursor ainda; listagens administrativas estão limitadas a 100 registros no MVP inicial.
