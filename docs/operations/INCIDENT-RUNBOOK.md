# Runbook de incidentes

## Severidade

- SEV-1: indisponibilidade ampla, exposição de dados ou ação externa indevida.
- SEV-2: degradação relevante, falha de jornada ou integração.
- SEV-3: erro localizado sem impacto relevante em dados ou continuidade.

## Resposta inicial

1. registrar horário, impacto, ambiente e responsável;
2. preservar o identificador de requisição e o identificador de correlação;
3. limitar o incidente: kill switch de integração/notificação quando aplicável;
4. não copiar tokens, Authorization, cookies ou dados pessoais para tickets;
5. avaliar isolamento, rollback ou manutenção;
6. comunicar partes autorizadas conforme o plano;
7. preservar evidências sem alterar logs originais.

## Encerramento

- identificar causa provável e causa raiz;
- registrar linha do tempo;
- confirmar recuperação por health/readiness e smoke test;
- avaliar impacto de privacidade e necessidade de comunicação;
- criar ações preventivas com responsável e prazo;
- revisar o runbook após o pós-incidente.

## Comandos de diagnóstico

    pnpm db:validate
    pnpm db:generate
    pnpm typecheck
    pnpm test
    pnpm build

Os comandos não substituem observabilidade centralizada nem autorização para operar produção.
