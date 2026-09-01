# Beneficiários, Solicitações e Jornada Operacional

> Documento consolidado da fundação atual. A Missão 1.2 iniciou beneficiários/solicitações; as missões seguintes adicionaram elegibilidade, encaminhamento, viabilidade FTTH, instalação, ativação e serviço ativo inicial.

## Objetivo

Registrar a jornada mínima do cidadão dentro do Quero Internet GovTech, mantendo separação entre decisão pública, execução técnica do provedor, ativação operacional e ciclo de vida do serviço.

## Regras de isolamento

- Beneficiário pertence obrigatoriamente a um tenant e a uma organização municipal.
- Solicitação pertence ao mesmo tenant, município e programa.
- Provedor não acessa cadastro municipal completo.
- Provedor só acessa dados mínimos quando houver encaminhamento explícito para sua organização.
- Tenant, município, provedor e programa são derivados de entidades persistidas e do contexto da sessão, não de headers informais.
- Todo endpoint sensível precisa de permissão específica no backend.

## Privacidade

- O documento bruto é aceito apenas na entrada e não é persistido.
- A deduplicação utiliza HMAC-SHA256 com `BENEFICIARY_IDENTITY_PEPPER` externo ao código.
- Apenas os quatro últimos dígitos ficam disponíveis para identificação operacional.
- AuditLog registra IDs técnicos, entidade, ator, organização, programa e correlação; não registra CPF bruto.
- DTOs de município e provedor são diferentes quando há risco de exposição excessiva.

## Linha de estados atual

### Solicitação

```text
SUBMITTED → UNDER_REVIEW → ELIGIBLE | INELIGIBLE | REFERRED | CANCELLED
```

Regras:

- elegibilidade é decisão humana e auditável;
- decisão exige motivo descritivo;
- IA não aprova nem reprova cidadão;
- encaminhamento ao provedor só ocorre quando a solicitação está elegível ou já em fluxo referenciado conforme regra de domínio.

### Encaminhamento ao provedor

```text
PENDING → ACCEPTED | DECLINED | CANCELLED
```

Regras:

- município encaminha para provedor participante ativo;
- provedor só responde ao que pertence à sua organização;
- recusa exige motivo;
- não pode haver múltiplos encaminhamentos ativos conflitantes para a mesma solicitação.

### Viabilidade FTTH

```text
FEASIBLE | EXPANSION_REQUIRED | NOT_FEASIBLE
```

Regras:

- avaliação é feita pelo provedor autorizado;
- `FEASIBLE` exige cobertura confirmada;
- portas disponíveis, distância de drop e referência de infraestrutura são dados operacionais, não autorização automática de instalação;
- expansão ou inviabilidade exigem motivo técnico;
- município recebe visão minimizada, sem topologia ou detalhe sensível do provedor.

### Instalação e ativação

```text
INSTALLATION_PENDING → SCHEDULED → IN_PROGRESS → INSTALLED → ACTIVATED
```

Exceções:

```text
FAILED
CANCELLED
```

Regras:

- ordem de instalação só nasce após encaminhamento aceito e viabilidade `FEASIBLE`;
- agendamento precisa estar no futuro;
- início exige ordem agendada;
- conclusão física exige resumo operacional;
- ativação exige instalação concluída;
- falha e cancelamento exigem motivo descritivo;
- transições inválidas falham fechadas;
- atualização concorrente precisa respeitar o estado atual.

### Serviço ativo inicial

O serviço ativo é separado da ordem de instalação. Ele representa a existência operacional de um serviço acompanhado pela plataforma, mas ainda não equivale a integração plena com ERP, faturamento público ou monitoramento contínuo.

Regras:

- serviço ativo nasce após instalação `ACTIVATED`;
- suspensão, cancelamento, restauração e encerramento exigem motivo e auditoria;
- estados externos futuros de IXC/SGP serão reconciliados por adapters, não tratados como fonte única de verdade;
- benefício público e elegibilidade permanecem decisões governadas, não automações opacas.

## Auditoria

Eventos críticos devem registrar:

- criação de beneficiário;
- criação de solicitação;
- decisão de elegibilidade;
- encaminhamento ao provedor;
- aceite/recusa;
- avaliação de viabilidade;
- criação da ordem de instalação;
- agendamento, início, instalação e ativação;
- criação e transições do serviço ativo.

## Limites atuais

- Sem upload real de documentos/evidências.
- Sem assinatura eletrônica.
- Sem integração IXC/SGP real.
- Sem reserva concorrente real de CTO/PON/porta.
- Sem notificação automática multicanal.
- Sem dashboard final de prestação de contas.
- Sem homologação para dados reais de beneficiários.

## Critério permanente para evolução

Qualquer novo passo da jornada precisa preservar minimização, autorização contextual, auditoria, tratamento previsível de erros e CI/Security Gate verdes antes do merge.
