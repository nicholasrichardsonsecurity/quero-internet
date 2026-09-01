# Gate de Piloto Controlado

> Status: NÃO APROVADO em 2026-09-01. Este documento registra critérios e evidências necessárias; não substitui homologação operacional, jurídica ou de segurança.

## Objetivo

Autorizar, ou rejeitar de forma rastreável, um piloto restrito com município e provedor participantes.

## Matriz de entrada e saída

| Critério | Evidência atual | Estado | Condição de saída |
|---|---|---|---|
| Código e migrations | CI do repositório | Parcial | CI verde na versão candidata e migration aplicada em homologação |
| Segurança de aplicação | Security Gate, RBAC, validações | Parcial | revisão manual, teste de autorização negativa e pentest proporcional ao risco |
| Privacidade/LGPD | princípios e minimização | Parcial | finalidade, controlador/operadores, retenção, canal do titular e registro de tratamento aprovados |
| Backup e restauração | Não há evidência operacional versionada | Bloqueado | executar e registrar restauração em ambiente isolado |
| Ambiente de homologação | Não há infraestrutura imutável descrita | Bloqueado | ambiente reproduzível, secrets externos e dados sintéticos |
| Jornada completa | Não há E2E completo | Bloqueado | município → beneficiário → revisão → provedor → instalação → serviço ativo |
| Acessibilidade | diretriz WCAG 2.2 AA | Parcial | avaliação manual e automatizada com correções críticas concluídas |
| Observabilidade | request/correlation ID, logs e métricas básicas | Parcial | retenção, acesso restrito, alertas e procedimento de resposta testados |
| Integrações externas | IXC/SGP simulados | Bloqueado | homologação somente leitura, timeout, allowlist, reconciliação e aprovação formal |
| Notificações | preview sem fornecedor | Bloqueado | fornecedor homologado, opt-out, templates aprovados e teste de não envio indevido |

## Critérios de aprovação

O gate somente pode ser marcado como aprovado quando:

- todos os itens bloqueados tiverem evidência anexada ao registro de release;
- não existir vulnerabilidade crítica ou alta sem aceite formal de risco;
- houver responsável operacional e canal de incidente;
- houver plano de rollback;
- os dados de teste forem sintéticos ou formalmente autorizados;
- a autoridade do município e do provedor tiver assinado a homologação;
- o escopo inicial estiver limitado a um piloto reversível.

## Escopo permitido antes da aprovação

- desenvolvimento;
- testes internos;
- demonstração com dados sintéticos;
- adapters IXC/SGP simulados;
- notificações em modo preview.

É proibido usar dados reais de beneficiários, ativar escrita externa ou declarar produção pública com este gate em estado não aprovado.
