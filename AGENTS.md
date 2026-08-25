# Quero Internet — Regras para agentes de programação

Este repositório implementa uma GovTech multiempresa. Agentes de IA auxiliam desenvolvimento, testes, documentação e revisão, mas não substituem decisões arquiteturais, jurídicas ou administrativas.

## Fonte de verdade
1. ADRs aceitos em `docs/adr/`.
2. Arquitetura consolidada em `docs/architecture/`.
3. Contratos e políticas versionados.
4. Código e testes.

## Regras obrigatórias
- Nunca remover isolamento multiempresa para simplificar implementação.
- Autorização sempre no backend; UI não é barreira de segurança.
- Nunca armazenar ou logar CPF, tokens, cookies, senhas ou secrets sem necessidade explícita e proteção adequada.
- IXC, SGP e outros ERPs entram somente por adapters/ACL.
- Escritas externas devem ser idempotentes e reconciliáveis.
- Não usar IA para aprovar/reprovar elegibilidade, efetivar benefício público ou autorizar pagamento.
- Nenhuma mudança crítica é considerada concluída sem teste correspondente.
- Não adicionar microserviço sem ADR aprovado.
- Preferir soluções simples, tipadas e auditáveis.

## Agentes recomendados
- Reviewer: revisão de arquitetura, segurança e regressão.
- Builder: implementação de tarefas pequenas com critérios de aceite claros.
- Test/QA: geração e auditoria de testes, inclusive isolamento multiempresa.

Agentes são ferramentas temporárias de engenharia, não componentes obrigatórios do produto.
