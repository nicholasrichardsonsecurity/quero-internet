# Estado do Produto e Fundação — 2026-09-05

> Registro executivo e técnico do estado real do Quero Internet GovTech após a evolução de faturamento municipal, operação do provedor, dashboards por persona e logout dos painéis.

## 1. Decisão de negócio consolidada

A **Aplivora** é a contratada e proprietária do SaaS Quero Internet GovTech. O modelo aprovado separa claramente os fluxos financeiros:

| Fluxo | Parte que cobra | Parte que recebe | Papel do Quero Internet |
|---|---|---|---|
| Mensalidade do SaaS | Aplivora | Aplivora | Gerar e acompanhar a cobrança municipal da plataforma |
| Serviço de conectividade aos beneficiários | Provedor participante | Provedor participante | Registrar medição, aprovação, NF e referência de pagamento |
| Repasse financeiro do provedor | Não aplicável | Não passa pela Aplivora | A plataforma não recebe nem repassa esse valor |

A prefeitura poderá visualizar no mesmo sistema:

1. a cobrança mensal do SaaS da Aplivora; e
2. a documentação operacional do serviço prestado pelo provedor, incluindo medição aprovada, NF própria e link/referência de pagamento.

Isso preserva a separação comercial e contábil: a Aplivora fatura seu próprio SaaS; o provedor fatura diretamente o serviço que prestou. A implementação técnica não substitui revisão jurídica, tributária, contratual ou de compras públicas.

## 2. O que já foi implementado

### Plataforma e segurança

- Monorepo pnpm/Turborepo com API NestJS, Web Next.js, Worker e Prisma.
- Multi-tenant com separação por tenant, organização, programa e sessão.
- RBAC no backend para contexto municipal e contexto de provedor.
- Sessões opacas persistidas com revogação e logout.
- Auditoria, request ID, correlation ID, erros padronizados e métricas básicas.
- CI com typecheck, testes, build, migrations PostgreSQL, auditoria de dependências e SAST/segredos.
- Webhook Asaas autenticado; eventos não relacionados ao produto são aceitos e ignorados com resposta idempotente, em vez de retornarem 400.
- Billing Hub da Aplivora separado da cobrança operacional do provedor.

### Faturamento municipal

- Fundação de contratos municipais SaaS.
- Períodos de competência com valor e vencimento.
- Estados iniciais de contrato e período.
- Associação futura do período a uma cobrança central da Aplivora.
- Rotas de criação e consulta de contratos e períodos.
- Homologação executada com contrato municipal e período mensal de teste.

Ainda falta, antes de produção:

- vincular automaticamente o período a uma cobrança real no Asaas;
- definir o cliente pagador municipal real;
- emitir boleto/Pix conforme contrato e política financeira;
- receber e reconciliar webhook de pagamento;
- permitir cancelamento, vencimento, estorno e segunda via com trilha de auditoria;
- validar fluxo jurídico, fiscal e de contratação pública.

### Faturamento operacional do provedor

Fluxo implementado:

1. provedor cria medição;
2. provedor envia medição;
3. município revisa e aprova;
4. provedor registra sua própria NF;
5. prefeitura visualiza a NF e a referência de pagamento.

Rotas implementadas:

- `POST /provider-billing/measurements`
- `GET /provider-billing/measurements`
- `POST /provider-billing/measurements/:measurementId/submit`
- `POST /provider-billing/measurements/:measurementId/approve`
- `POST /provider-billing/measurements/:measurementId/invoice`
- `GET /provider-billing/measurements/:measurementId/invoice`

A homologação já validou uma medição no valor de R$ 149,90, com submissão, aprovação e registro de NF. O pagamento continua fora da conta da Aplivora.

### Dashboards e experiência web

- Dashboard municipal com KPIs operacionais e dados do banco.
- Dashboard do provedor com fila operacional e dados do banco.
- Rotas dedicadas de faturamento municipal e faturamento do provedor.
- Logout implementado nos dois painéis de faturamento e no dashboard principal.
- Fallback controlado e selo de dados demonstrativos mantidos quando aplicável.

## 3. Estado de deploy atual

### API

**Estado: validada em homologação.**

- `https://api.aplivora.com.br/ready` respondeu HTTP 200.
- Banco conectado.
- Migrations aplicadas.
- Rotas de billing e provider-billing registradas.
- Webhook Asaas validado com HTTP 201 para evento relacionado e evento externo ignorado.

### Web

**Estado: código mergeado, deploy visual pendente de validação.**

O GitHub contém as páginas dedicadas e o botão `Sair`, mas o container público chegou a exibir “Módulo não encontrado”. Isso prova que a imagem ativa não correspondia ao código atual, ou que o container não foi recriado após o build.

Causa operacional conhecida:

- o compose de homologação não possui um serviço chamado `web`;
- o container `quero-internet-web-homolog` foi criado manualmente;
- o Dockerfile exige `pnpm-lock.yaml`, que não está versionado;
- executar `docker compose ... build web` falha com “no such service: web”;
- executar `docker build` sem lockfile falha no `COPY pnpm-lock.yaml`.

Regra de deploy web homolog:

1. obter o commit mergeado de `origin/main`;
2. gerar lockfile temporário apenas para o build;
3. construir `quero-internet-web:homolog` no contexto da raiz do repositório;
4. recriar explicitamente `quero-internet-web-homolog` com `--network host`;
5. validar localmente e pelo domínio público:
   - `/login`;
   - `/faturamento-provedor`;
   - `/faturamento-municipal`;
   - presença do texto `Sair`;
   - ausência de `Módulo não encontrado`.

O item só deve ser marcado como concluído depois dessa validação observável.

## 4. Evidências de homologação

Validações já observadas:

- API ready: HTTP 200.
- Login municipal: sucesso.
- Login provedor: sucesso.
- Contrato SaaS municipal: criado.
- Período mensal: criado com status `OPEN`.
- Medição do provedor: criada como `DRAFT`.
- Medição: enviada como `SUBMITTED`.
- Medição: aprovada como `APPROVED`.
- NF do provedor: registrada como `REGISTERED`.
- Consulta de medições e NF: sucesso.
- Reconciliation worker: entregas processadas com sucesso em homologação.
- Rotas web dedicadas: código presente no branch principal; imagem pública ainda exige validação final.

Evidência não deve ser confundida com prontidão de produção. Logs, seeds e URLs de homologação não representam contrato real com prefeitura ou provedor.

## 5. Backlog prioritário

### Próximo gate — corrigir e validar o deploy web

- Recriar a imagem web a partir de `origin/main`.
- Confirmar as duas rotas dedicadas no container.
- Confirmar o botão Sair nos dois painéis.
- Testar logout e redirecionamento para `/login`.
- Registrar o resultado do deploy no runbook.

### Depois do deploy

1. integrar período municipal com cobrança real da Aplivora;
2. criar telas de cobrança municipal e status de pagamento;
3. adicionar visualização municipal da NF do provedor;
4. adicionar filtros, paginação e exportação auditável;
5. adicionar testes E2E município → provedor → NF;
6. completar backup/restore, retenção, alertas e observabilidade;
7. revisar acessibilidade;
8. executar revisão jurídica, fiscal, LGPD e compras públicas;
9. somente então avaliar gate de piloto controlado.

## 6. Limites permanentes

- A Aplivora não deve receber valores pertencentes ao provedor neste modelo.
- A NF do provedor não é emitida pela Aplivora.
- O Quero Internet não deve transformar uma medição aprovada em prova automática de pagamento.
- Nenhuma decisão de elegibilidade ou benefício pode ser delegada à IA.
- Nenhum ERP externo é fonte única de verdade.
- Integrações de escrita exigem idempotência, reconciliação, auditoria e kill switch.
- Homologação não é produção e dados sintéticos não são dados de cidadãos reais.

## 7. Critério de conclusão desta fase

Esta fase estará concluída quando:

- a imagem web atual estiver publicada e validada nas quatro verificações de rota;
- logout funcionar para município e provedor;
- o vínculo período municipal → cobrança Aplivora estiver implementado e testado;
- a prefeitura visualizar a NF do provedor sem que a Aplivora intermedeie o recebimento;
- CI, Security Gate, testes e migrations permanecerem verdes;
- documentação, evidências e decisão de go/no-go estiverem registradas.
