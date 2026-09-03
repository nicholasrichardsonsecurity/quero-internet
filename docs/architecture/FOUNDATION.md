# Fundação Técnica — Quero Internet GovTech

> Baseline consolidado em 2026-09-01 após recuperação do Security Gate e avanço da Fase 1 até o ciclo de vida inicial do serviço ativo.

## Propósito da fundação

A fundação técnica do **Quero Internet GovTech** existe para permitir que programas públicos de conectividade sejam operados com segurança, rastreabilidade, segregação multiempresa e evolução controlada.

O produto não é um ERP de provedor, não é um sistema financeiro público e não é um motor autônomo de decisão administrativa. Ele coordena a jornada entre município, cidadão elegível e provedor participante, preservando evidências, estados de domínio e trilhas de auditoria.

## Arquitetura aprovada

O projeto segue como **monólito modular TypeScript**, com possibilidade de extração futura apenas mediante ADR e evidência operacional.

Componentes-base:

- **Web/PWA:** Next.js.
- **API:** NestJS.
- **Worker:** processamento assíncrono e integrações futuras.
- **Banco:** PostgreSQL via Prisma.
- **Cache/coordenação:** Redis.
- **Arquivos:** storage compatível com S3/MinIO.
- **CI/Security Gate:** GitHub Actions com migração real PostgreSQL, typecheck, testes, build, auditoria de dependências e SAST/segredos.

## Fronteiras permanentes

1. **Autorização no backend.** Frontend não é barreira de segurança.
2. **Multiempresa desde a fundação.** `Tenant`, `Organization`, `Program`, `ProgramParticipation`, `Membership` e `Session` formam a base de isolamento.
3. **Contexto derivado da sessão.** Tenant, organização e papéis não devem ser aceitos de headers arbitrários.
4. **Domínio desacoplado de ERP.** IXC, SGP e similares entram por adapters/ACL, nunca diretamente dentro das regras centrais.
5. **Escritas externas futuras devem ser idempotentes, reconciliáveis e reversíveis operacionalmente quando possível.**
6. **Auditoria é append-only.** Logs de auditoria registram ação, ator, organização, programa, entidade e correlação, sem expor dados pessoais desnecessários.
7. **Estados de negócio não são inferidos de um único status externo.** O domínio usa transições explícitas, validações e eventos auditáveis.
8. **IA não decide elegibilidade, suspensão, pagamento, ativação administrativa ou penalidade.**

## Domínios implementados na fundação atual

### Núcleo institucional

- Tenant.
- Organização.
- Unidade organizacional.
- Programa.
- Participação no programa.
- Usuário, vínculo, papéis e sessão.
- Auditoria.

### Identidade e acesso

- Sessão bearer opaca com hash persistido.
- Contexto organizacional ativo fail-closed.
- RBAC com permissões específicas por domínio.
- Logout e troca de contexto organizacional.
- Proteções de login e validações de entrada.

### Beneficiário e solicitação

- Cadastro municipal com minimização.
- Documento bruto não persistido.
- Deduplicação por HMAC com pepper externo.
- Solicitação por programa.
- Revisão de elegibilidade humana e auditável.

### Encaminhamento ao provedor

- Encaminhamento de solicitação elegível.
- Provedor só acessa o que foi encaminhado a ele.
- Aceite/recusa com motivo quando aplicável.
- Restrição a participação ativa no programa.

### Viabilidade técnica FTTH

- Avaliação técnica por provedor autorizado.
- Resultados: `FEASIBLE`, `EXPANSION_REQUIRED`, `NOT_FEASIBLE`.
- Cobertura e capacidade não são inferidas apenas por CEP.
- Dados técnicos sensíveis não são expostos no DTO municipal.

### Instalação e ativação

- Ordem criada somente após encaminhamento aceito e viabilidade `FEASIBLE`.
- Fluxo: `INSTALLATION_PENDING → SCHEDULED → IN_PROGRESS → INSTALLED → ACTIVATED`.
- Falha/cancelamento exigem motivo descritivo.
- Transições inválidas falham fechadas.
- Atualizações concorrentes usam controle por estado atual.

### Serviço ativo

- Serviço ativo nasce a partir de instalação `ACTIVATED`.
- Ciclo inicial do serviço separa estado do benefício, estado operacional e futuras integrações com ERP.
- Suspensão, cancelamento, restauração e encerramento exigem motivo e auditoria.
- Não há decisão automática de benefício por IA ou por status isolado de ERP.

## Segurança e privacidade

Controles obrigatórios para todo novo incremento:

- validação de entrada;
- menor privilégio;
- DTOs diferentes por contexto;
- sem CPF/documento bruto em logs;
- sem secrets em código;
- tratamento previsível de erros;
- testes de autorização quando houver permissão nova;
- migração PostgreSQL real quando houver persistência nova;
- Security Gate verde antes de merge.

## Gates de continuidade

Nenhum incremento estrutural deve ser tratado como concluído sem:

1. documentação da decisão ou missão;
2. implementação mínima coerente;
3. migration validada quando houver banco;
4. testes de domínio/autorização;
5. typecheck, testes, build e Security Gate verdes;
6. PR revisável;
7. merge somente após verificação verde.

## Fora da fundação atual

Ainda não fazem parte da fundação pronta para produção:

- integração real IXC/SGP;
- provisionamento automático;
- reserva concorrente real de CTO/PON/porta;
- assinatura eletrônica de beneficiário;
- DMS completo de evidências;
- notificações multicanal;
- relatórios oficiais de prestação de contas;
- observabilidade completa com OpenTelemetry;
- auditoria legal externa;
- piloto real com dados sensíveis.

## Status

A fundação técnica está apta a continuar a construção do MVP operacional, mas **não está aprovada para piloto público nem produção**. O próximo avanço deve manter a separação entre arquitetura aprovada, evidência implementada e prontidão operacional real.


## Padrão de ícones e linguagem visual

O produto adota **Lucide React** como biblioteca oficial de ícones para Web/PWA. A decisão atende à necessidade de dashboards complexos, navegação operacional e componentes consistentes, com ícones SVG leves, customizáveis e compatíveis com a arquitetura Next.js.

Regras permanentes:

1. A dependência deve permanecer declarada em `apps/web/package.json`.
2. O Next.js deve manter `experimental.optimizePackageImports: ['lucide-react']` para otimização de imports.
3. O registro compartilhado e tipado deve ficar em `apps/web/components/ui/icon.tsx`.
4. Server Components são preferidos para ícones estáticos; Client Components só quando houver estado, evento ou animação dependente do cliente.
5. Ícones não devem ser usados como único meio de comunicação: ações críticas precisam de texto, tooltip acessível ou nome semântico.
6. Novos ícones devem respeitar a grade visual, espessura consistente e contraste do sistema de marca.
7. Não adicionar bibliotecas concorrentes para o mesmo propósito sem ADR e justificativa de manutenção.
