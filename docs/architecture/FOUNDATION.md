# Fundação Técnica — Quero Internet GovTech

> Baseline consolidado em 2026-09-03 após a fundação do MVP operacional e a preparação do ambiente isolado de homologação.

## Propósito

A fundação técnica permite operar programas públicos de conectividade com segurança, rastreabilidade, segregação multiempresa e evolução controlada.

O produto coordena a jornada entre município, cidadão elegível e provedor participante. Não é provedor de internet, ERP de provedor, sistema financeiro público ou motor autônomo de decisão administrativa.

## Arquitetura aprovada

O projeto segue como monólito modular TypeScript, com workers assíncronos e adapters de integração. Extrações para microsserviços exigem ADR, evidência técnica e necessidade operacional real.

Componentes-base:

- Web/PWA: Next.js;
- API: NestJS;
- Worker: processamento assíncrono e integrações futuras;
- banco: PostgreSQL via Prisma;
- cache/coordenação: Redis;
- arquivos: MinIO local ou storage compatível com S3;
- CI/Security Gate: migrations, typecheck, testes, build, auditoria e SAST/segredos.

## Princípios permanentes

1. autorização no backend; frontend não é barreira de segurança;
2. multiempresa desde a fundação, com tenant, organização, programa, participação, vínculo e sessão;
3. contexto derivado da sessão, nunca de headers arbitrários;
4. domínio desacoplado de ERP; IXC e SGP entram por adapters/ACL;
5. escritas externas futuras idempotentes, reconciliáveis e operacionalmente reversíveis quando possível;
6. auditoria append-only, com correlação e minimização de dados pessoais;
7. estados de negócio explícitos, sem depender de um único status externo;
8. IA não decide elegibilidade, suspensão, pagamento, ativação administrativa ou penalidade;
9. secrets são fornecidos pelo ambiente e nunca commitados;
10. dados de homologação são sintéticos e não podem ser substituídos por cópias de produção.

## Domínios implementados

- núcleo institucional: tenant, organização, unidade, programa, participação, usuário, vínculo, sessão e auditoria;
- identidade e acesso: sessão bearer opaca, contexto organizacional fail-closed, RBAC, logout e proteções de login;
- beneficiário e solicitação: cadastro minimizado, documento bruto não persistido, deduplicação HMAC e revisão humana;
- provedor: encaminhamento contextual, aceite/recusa e participação ativa;
- viabilidade FTTH: avaliação autorizada com resultados explícitos e DTOs por contexto;
- instalação e ativação: estados `INSTALLATION_PENDING`, `SCHEDULED`, `IN_PROGRESS`, `INSTALLED` e `ACTIVATED`;
- serviço ativo: ciclo operacional separado do benefício e de integrações futuras;
- evidências, sincronização simulada somente leitura, notificações sem envio externo e observabilidade inicial.

## Segurança e privacidade

Todo incremento deve validar entrada, aplicar menor privilégio, separar DTOs por contexto, evitar documento bruto em logs, manter tratamento previsível de erros, adicionar testes de autorização e usar migration real quando houver persistência.

Os gates são: documentação da decisão, implementação coerente, migration validada, testes de domínio/autorização, typecheck, testes, build, Security Gate e PR revisável.

## Ambiente e instalação

O procedimento oficial está em [`docs/operations/INSTALLATION.md`](../operations/INSTALLATION.md). Ele cobre pré-requisitos, instalação local, Docker Compose, configuração de secrets, migrations, seed sintético, smoke test, isolamento e encerramento seguro.

Homologação usa compose project, rede e volumes próprios; não publica PostgreSQL, Redis ou MinIO no host. A convivência com outros produtos, inclusive LoopClub, exige que nenhum container, volume, rede ou porta externa de outro projeto seja alterado.

## Status e limites

O ambiente isolado de homologação possui PostgreSQL, Redis e MinIO configurados, com migrations do schema aplicadas. Isso demonstra preparação técnica do ambiente, não aprovação de piloto público nem produção.

Ainda fora da fundação pronta para produção: integração real IXC/SGP, provisionamento automático, reserva concorrente real de rede, assinatura eletrônica, notificações multicanal, relatórios oficiais, OpenTelemetry completo, auditoria legal externa e piloto com dados sensíveis.

## Regra de continuidade

Não tratar um incremento estrutural como concluído sem evidência correspondente. O estado do código, o estado do ambiente e a aprovação operacional devem permanecer registrados separadamente.