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
| Identidade visual | Implementado inicial | Símbolo, brand board e diretrizes iniciais. |
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
| Integrações IXC/SGP | Arquitetura aprovada, não implementado real | Somente adapters futuros; sem escrita externa real no MVP atual. |
| DMS/evidências | Arquitetura aprovada, não implementado completo | Uploads, hashes, OCR e assinaturas ficam para fase própria. |
| Notificações | Pendente | Sem SMS/e-mail/WhatsApp transacional. |
| Relatórios oficiais | Pendente | Sem prestação de contas final. |
| Observabilidade avançada | Pendente | Logs básicos; OpenTelemetry e dashboards ainda futuros. |
| Piloto público | Não aprovado | Depende de gate de segurança, privacidade, operação e homologação. |

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
```

## Segurança atual da trilha

- Security Gate com auditoria de dependências de produção.
- SAST/segredos via Semgrep.
- CI com validação Prisma, geração Prisma, migrations PostgreSQL, typecheck, testes e build.
- Correção permanente: qualquer falha agendada de Security Gate em `main` bloqueia avanço de missão até recuperação.

## Débitos controlados

1. Não há lockfile persistido no repositório; o pipeline usa instalação sem frozen lockfile e depende de overrides explícitos para reduzir deriva.
2. A camada web ainda é shell inicial; muitas operações existem primeiro na API.
3. Não há ambiente de homologação descrito por infraestrutura imutável.
4. Não há seed completo de demonstração governamental.
5. Não há testes E2E de jornada completa município → provedor → serviço ativo.

## Próximos gates recomendados

1. **Gate 1.7 — Contratos/API pública interna:** padronizar DTOs, erros, OpenAPI e versionamento.
2. **Gate 1.8 — Dashboard operacional:** telas reais por perfil com dados do domínio já implementado.
3. **Gate 1.9 — Evidências/documentos:** DMS mínimo, hash, classificação e privacidade.
4. **Gate 1.10 — Integrações supervisionadas:** adapters IXC/SGP ainda sem automação plena.
5. **Gate de piloto:** segurança, privacidade, backup/restore, observabilidade, acessibilidade e operação.
