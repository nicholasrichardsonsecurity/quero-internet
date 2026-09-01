# Arquitetura — Agregações do Dashboard Operacional

## Decisão

O dashboard operacional passa a ter um endpoint backend próprio para agregações reais:

```http
GET /dashboard/operational
```

A tela web deve acessar esse contrato preferencialmente pelo BFF:

```http
GET /api/dashboard/operational
```

## Motivo

O dashboard da Missão 1.8 criou a experiência visual por persona. A Missão 1.9 cria a base segura para alimentar essa experiência com dados reais sem vazar informação sensível entre município, provedor, auditoria e suporte.

## Escopos

| Persona | Escopo | Regra |
|---|---|---|
| Município | `municipality` | Filtra por `municipalityOrganizationId` e `tenantIds` da sessão. |
| Provedor | `provider` | Filtra por `providerOrganizationId` e `tenantIds` da sessão. |
| Auditoria | `audit` | Visão agregada/minimizada no tenant autorizado. |
| Suporte | `support` | Visão mínima para orientação e triagem. |
| Plataforma | `tenant` | Visão agregada multi-organização dentro dos tenants autorizados. |

## Privacidade

O endpoint não retorna:

- CPF ou documento bruto;
- documento hash;
- telefone/e-mail de beneficiário;
- endereço detalhado;
- portas disponíveis;
- referência de CTO/splitter/topologia;
- motivo técnico detalhado;
- identificadores de filas de outros provedores.

## Segurança

- RBAC via `dashboard:read`.
- Sessão resolvida por token opaco já existente.
- Tenant isolation obrigatório via `context.tenantIds`.
- Resposta agregada, sem lista de pessoas.
- `dataSource: database` identifica que os dados vieram do banco.
- O contrato usa o envelope global de erro da API quando falha.

## Limites atuais

- Ainda não há cache ou snapshot materializado.
- Ainda não há filtros por período/programa no contrato.
- O dashboard web pode manter fallback de referência enquanto o endpoint não estiver disponível em ambientes antigos.
- Não substitui relatórios oficiais nem prestação de contas.

## Evolução prevista

1. Filtros por programa/período.
2. Paginação/cursor para filas reais.
3. Snapshots auditáveis por competência.
4. Cache controlado por tenant/persona.
5. Métricas de SLA e aging por etapa.
