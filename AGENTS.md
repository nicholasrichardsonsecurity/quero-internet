# Quero Internet — Regras para agentes de programação

Este repositório implementa uma GovTech multiempresa para programas públicos de conectividade. Agentes de IA podem auxiliar desenvolvimento, testes, documentação e revisão, mas não substituem decisões arquiteturais, jurídicas, administrativas ou operacionais.

## Fonte de verdade

A ordem de autoridade do projeto é:

1. ADRs aceitos em `docs/adr/`.
2. Fundação consolidada em `docs/architecture/FOUNDATION.md`.
3. Status consolidado em `docs/architecture/IMPLEMENTATION-STATUS.md`.
4. Arquitetura de domínio em `docs/architecture/`.
5. Missões versionadas em `docs/missions/`.
6. Contratos, políticas e migrations.
7. Código e testes.

Quando houver divergência, não escolher silenciosamente uma versão. Abrir correção documental ou ADR de supersessão.

## Regras obrigatórias

- Nunca remover isolamento multiempresa para simplificar implementação.
- Autorização sempre no backend; UI não é barreira de segurança.
- Nunca aceitar tenant, organização, programa ou papel a partir de header informal quando a sessão ou entidade persistida deve definir o contexto.
- Nunca armazenar ou logar CPF bruto, tokens, cookies, senhas ou secrets sem necessidade explícita e proteção adequada.
- IXC, SGP e outros ERPs entram somente por adapters/ACL.
- Escritas externas devem ser idempotentes, reconciliáveis, auditáveis e protegidas por kill switch quando aplicável.
- Não usar IA para aprovar/reprovar elegibilidade, efetivar benefício público, autorizar pagamento, suspender benefício ou aplicar penalidade.
- Nenhuma mudança crítica é considerada concluída sem teste correspondente.
- Não adicionar microserviço sem ADR aprovado.
- Preferir soluções simples, tipadas, rastreáveis e auditáveis.
- Qualquer permissão nova precisa de teste de RBAC.
- Qualquer tabela nova precisa de migration PostgreSQL real e checks quando a regra for persistível.
- Qualquer falha de CI ou Security Gate em `main` bloqueia novas missões até recuperação.

## Gates obrigatórios antes de merge

Todo PR estrutural deve passar por:

1. documentação da missão/decisão;
2. implementação coerente com a arquitetura aprovada;
3. validação Prisma quando houver banco;
4. migration deploy em PostgreSQL quando houver migration;
5. typecheck;
6. testes;
7. build;
8. Security Gate com auditoria de dependências e SAST/segredos;
9. revisão contra isolamento multiempresa, LGPD e autorização deny-by-default.

Não marcar como concluído se qualquer verificação estiver vermelha, ausente ou indeterminada.

## Agentes recomendados

- **Reviewer:** revisão de arquitetura, segurança, regressão e consistência documental.
- **Builder:** implementação de tarefas pequenas com critérios de aceite claros.
- **Test/QA:** geração e auditoria de testes, inclusive isolamento multiempresa e transições inválidas.
- **Security:** análise de superfície, segredos, dependências, validação de entrada e minimização de dados.
- **Docs:** atualização de README, fundação, status, ADRs e missões.

Agentes são ferramentas temporárias de engenharia, não componentes obrigatórios do produto.

## Proibições permanentes

- Não simular conformidade LGPD, ASVS ou produção sem evidência.
- Não declarar piloto aprovado sem gate formal.
- Não criar automação de ERP que altere serviço real sem modo supervisionado, idempotência e reconciliação.
- Não substituir auditoria append-only por logs comuns.
- Não expor topologia técnica sensível do provedor em DTO municipal.
- Não transformar status externo de ERP em fonte única de verdade.
