# Status Consolidado de Implementação

> Atualizado em 2026-09-01. Este documento separa arquitetura aprovada, implementação existente e pendências antes de piloto/produção.

## Regra de leitura

- **Aprovado arquiteturalmente** significa que a direção foi validada como decisão de arquitetura/produto.
- **Implementado** significa que existe código, migration ou documentação no repositório.
- **Pronto para produção** exige evidências adicionais: segurança, privacidade, operação, observabilidade, restauração, testes de carga, acessibilidade, contratos e homologação.

## Estado por bloco

| Bloco | Estado | Observação |
|---|---|---|
| Fundação de monorepo | Implementado | pnpm, Turborepo, apps, packages, CI e Security Gate. |
| Branding oficial | Implementado inicial | Brand book v1.1, mensagens, sistema visual, tokens, README e brand guidelines atualizados. |
| Identidade visual | Implementado inicial | Símbolo, brand board, paleta, tipografia, iconografia e regras de uso. |
| Multiempresa | Implementado inicial | Tenant, organizações, programas, participações, vínculos e sessão contextual. |
| Autenticação/sessão | Implementado inicial | Token opaco, hash persistido, troca de contexto e logout. |
| RBAC | Implementado inicial | Permissões por papel e guard no backend. |
| Beneficiários | Implementado inicial | Cadastro municipal mínimo com documento bruto não persistido. |
| Solicitações | Implementado inicial | Solicitação por programa, status e revisão. |
| Elegibilidade humana | Implementado inicial | Decisão auditável com motivo; sem IA decisória. |
| Encaminhamento ao provedor | Implementado inicial | Município encaminha; provedor aceita/recusa no escopo autorizado. |
| Viabilidade FTTH | Implementado inicial | Resultado técnico, restrições e DTO municipal minimizado. |
| Instalação/ativação | Implementado inicial | Ordem operacional e máquina de estados até `ACTIVATED`. |
| Serviço ativo | Implementado inicial | Ciclo básico após ativação, separado de ERP e benefício automático. |
| Contratos HTTP internos | Implementado inicial | Envelope de erro, códigos estáveis, request id e política de versionamento inicial. |
| Dashboard operacional | Implementado inicial | Tela por persona operacional conectada ao BFF de dados reais com fallback controlado. |
| Agregações do dashboard | Implementado inicial | Endpoint `GET /dashboard/operational` com contagens reais, RBAC, tenant isolation e minimização por perfil. |
| UX de dados reais | Implementado inicial | Loading, erro, botão de recarga, selo `DADOS DO BANCO` e fallback explicitamente rotulado. |
| Evidências/documentos | Implementado inicial | Registro de metadados, SHA-256, classificação, finalidade, retenção e escopo multiempresa; upload binário completo ainda pendente. |
| Integrações IXC/SGP | Implementado inicial | Adapters simulados somente leitura, prévia idempotente, hash de resultado e auditoria; sem escrita externa real. |
| DMS/evidências | Arquitetura aprovada, não implementado completo | Uploads, hashes, OCR e assinaturas ficam para fase própria. |
| Notificações | Implementado inicial | Templates, consentimento/opt-out, prévia idempotente e auditoria; nenhum fornecedor externo acionado. |
| Relatórios oficiais | Pendente | Sem prestação de contas final. |
| Observabilidade operacional | Implementado inicial | Request/correlation ID, logs JSON sanitizados, métricas básicas e endpoint `/metrics`; retenção centralizada, OpenTelemetry e alertas persistentes ainda pendentes. |
| Piloto controlado | Não aprovado | Gate formal criado; depende de evidências de segurança, privacidade, backup/restauração, acessibilidade, operação e homologação. |

## Linha operacional atual do MVP

```text
Programa municipal ativo
  → Beneficiário cadastrado
  → Solicitação submetida
  → Revisão humana de elegibilidade
  → Encaminhamento ao provedor participante
  → Aceite/recusa do provedor
  → Viabilidade FTTH
  → Ordem de instalação
  → Agendamento
  → Execução em campo
  → Instalação concluída
  → Ativação registrada
  → Serviço ativo inicial
  → Dashboard operacional agregado por perfil
  → Dashboard web consumindo dados reais com fallback controlado
```

## Branding atual

- Nome oficial: **Quero Internet GovTech**.
- Nome curto: **Quero Internet**.
- Slogan oficial: **Conectando pessoas, transformando cidades.**
- Posicionamento: GovTech/SaaS para gestão operacional, segura e auditável de programas públicos de conectividade.
- Documentos oficiais:
  - `docs/brand/BRAND-BOOK.md`
  - `docs/brand/BRAND-TOKENS.json`
  - `docs/brand/MESSAGING.md`
  - `docs/brand/VISUAL-SYSTEM.md`
  - `docs/design/BRAND-GUIDELINES.md`

## Contrato HTTP atual

- Versão contratual inicial: `v1`.
- Data-base do contrato: `2026-09-01`.
- Header de versão recomendado: `x-api-version`.
- Header de rastreio recomendado: `x-request-id`.
- Erros seguem envelope único em `error.code`, `error.message`, `error.statusCode`, `error.path`, `error.timestamp` e `error.requestId` quando fornecido.

## Dashboard operacional atual

- Resolve persona pela sessão autenticada.
- Consome o BFF `GET /api/dashboard/operational` no navegador.
- O BFF chama a API interna `GET /dashboard/operational` com o token server-side.
- Exibe KPIs, esteira, filas e próximos passos por perfil.
- Mostra `DADOS DO BANCO` quando os agregados reais são carregados.
- Mostra `FALLBACK CONTROLADO` quando a agregação falha.
- Mantém avisos de privacidade e minimização.
- Não substitui autorização do backend por lógica visual.

## Segurança atual da trilha

- Security Gate com auditoria de dependências de produção.
- SAST/segredos via Semgrep.
- CI com validação Prisma, geração Prisma, migrations PostgreSQL, typecheck, testes e build.
- Correção permanente: qualquer falha agendada de Security Gate em `main` bloqueia avanço de missão até recuperação.

## Débitos controlados

1. Não há lockfile persistido no repositório; o pipeline usa instalação sem frozen lockfile e depende de overrides explícitos para reduzir deriva.
2. O fallback de referência do dashboard deve ser removido ou condicionado por feature flag antes de produção pública.
3. Não há ambiente de homologação descrito por infraestrutura imutável.
4. Não há seed completo de demonstração governamental.
5. Não há testes E2E de jornada completa município → provedor → serviço ativo.
6. OpenAPI completo ainda não foi gerado a partir dos DTOs reais.
7. Paginação/cursor ainda não foi padronizada em todas as listagens.
8. Falhas de dashboard ainda não emitem telemetria estruturada.
9. Branding ainda precisa de revisão gráfica final antes de campanhas públicas, materiais impressos e uso institucional com órgão específico.
10. O DMS atual registra metadados e referências de storage, mas ainda não possui upload, antivírus, presigned URLs ou política automatizada de expiração.

## Gate de piloto

- Registro formal: docs/operations/PILOT-GATE.md.
- Checklist de release: docs/operations/PILOT-RELEASE-CHECKLIST.md.
- Exercício de continuidade: docs/operations/BACKUP-RESTORE-DRILL.md.
- Resposta a incidentes: docs/operations/INCIDENT-RUNBOOK.md.
- Estado atual: não aprovado; documentação não é evidência de execução.

## Próximos gates recomendados

1. **Gate 1.11 — Evidências/documentos:** DMS mínimo, hash, classificação e privacidade — implementado inicialmente; upload seguro completo permanece como evolução.
2. **Gate 1.12 — Integrações supervisionadas:** contrato comum IXC/SGP, health check e sync preview simulado — implementado inicialmente; homologação e leitura real permanecem pendentes.
3. **Gate 1.13 — Notificações transacionais:** base governada implementada inicialmente; conexão com fornecedor e envio real permanecem pendentes.
4. **Gate 1.14 — Observabilidade operacional:** baseline implementado inicialmente; retenção centralizada, OpenTelemetry e alertas persistentes permanecem pendentes.
5. **Gate de piloto:** segurança, privacidade, backup/restore, observabilidade, acessibilidade e operação — em avaliação, não aprovado.
