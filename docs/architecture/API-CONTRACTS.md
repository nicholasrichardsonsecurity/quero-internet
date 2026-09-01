# Contratos Internos de API — Quero Internet

> Estado: contrato inicial da Fase 1. Não representa API pública comercial nem autorização para piloto/produção.

## Objetivo

Padronizar a comunicação HTTP entre API, Web/BFF, workers e futuros consumidores internos do Quero Internet.

O contrato deve favorecer previsibilidade, segurança, rastreabilidade e evolução sem quebra silenciosa.

## Princípios

1. O backend é a fonte de verdade de autorização.
2. DTOs nunca devem expor mais dados do que o contexto precisa.
3. Erros devem ser estáveis para o frontend, mas não devem vazar detalhes internos.
4. Mudanças incompatíveis exigem versionamento ou compatibilidade transitória.
5. Integrações externas IXC/SGP não consomem diretamente o domínio; passam por adapters/ACL.
6. A documentação deve diferenciar claramente: contrato interno, API pública futura e integração externa.

## Versão contratual

| Campo | Valor |
|---|---|
| Versão atual | `v1` |
| Data-base | `2026-09-01` |
| Header recomendado | `x-api-version` |
| Request ID | `x-request-id` |

Nesta fase, as rotas existentes não são movidas para `/v1` para evitar quebra prematura do MVP. O versionamento começa como contrato documentado e constante de código.

## Envelope de erro

Formato padrão:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Status de serviço inválido.",
    "statusCode": 400,
    "path": "/provider-referrals/abc/service",
    "timestamp": "2026-09-01T00:00:00.000Z",
    "requestId": "req-123"
  }
}
```

`requestId` aparece quando o consumidor envia `x-request-id`.

### Códigos iniciais

| HTTP | Código estável |
|---|---|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `RESOURCE_NOT_FOUND` |
| 409 | `CONFLICT` |
| 429 | `RATE_LIMITED` |
| 500+ | `INTERNAL_ERROR` |

Códigos específicos por domínio só devem ser adicionados quando houver necessidade real, teste e documentação.

## Política de mensagens

- 4xx pode preservar mensagens de domínio quando seguras.
- 5xx deve retornar mensagem genérica.
- Stack trace, SQL, secrets, tokens, cookies, CPF bruto e detalhes internos não entram em resposta.
- Mensagens de validação podem ser agregadas de forma legível, desde que não exponham dados sensíveis.

## Respostas de sucesso

Nesta missão não é imposto envelope global de sucesso. As respostas existentes continuam retornando DTOs diretos.

Motivo: evitar retrabalho antes das telas operacionais e não quebrar BFF/consumidores internos futuros.

## DTOs e minimização

Regras permanentes:

- DTO de provedor pode conter dados operacionais do provedor, mas não deve expor cadastro municipal completo sem necessidade.
- DTO municipal pode enxergar resumo de execução, status e provedor, mas não deve receber topologia interna, porta disponível, referência de infraestrutura ou detalhe técnico sensível além do necessário.
- CPF bruto não é persistido nem retornado.
- Hashes, tokens, cookies, senhas e secrets não são DTOs de saída.
- Dados de auditoria devem referenciar entidades por IDs técnicos e contexto, não por conteúdo sensível.

## Status conhecidos da jornada

### Solicitação

`SUBMITTED`, `UNDER_REVIEW`, `ELIGIBLE`, `INELIGIBLE`, `REFERRED`, `CANCELLED`

### Encaminhamento ao provedor

`PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`

### Viabilidade FTTH

`FEASIBLE`, `EXPANSION_REQUIRED`, `NOT_FEASIBLE`

### Instalação

`INSTALLATION_PENDING`, `SCHEDULED`, `IN_PROGRESS`, `INSTALLED`, `ACTIVATED`, `FAILED`, `CANCELLED`

### Serviço ativo

`ACTIVE`, `SUSPENDED`, `INTERRUPTED`, `ENDED`

## Regras para futuras integrações

Adapters IXC/SGP devem mapear suas respostas para contratos internos próprios. Nenhuma tela ou decisão administrativa deve depender diretamente do shape bruto de um ERP.

Operações externas de escrita exigem:

- idempotência;
- timeout;
- estado indeterminado tratado;
- reconciliação;
- kill switch;
- auditoria;
- política de retry;
- separação entre simulação/homologação/produção.

## Próximos incrementos de contrato

1. OpenAPI gerado ou mantido a partir dos DTOs reais.
2. DTOs tipados por módulo.
3. paginação/cursor padronizada.
4. códigos de erro por domínio.
5. contratos de webhook/inbox.
6. contratos de integração IXC/SGP supervisionada.
