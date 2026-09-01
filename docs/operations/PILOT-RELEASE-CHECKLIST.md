# Checklist de release do piloto

## Produto e operação

- [ ] escopo, município, provedor e responsáveis definidos;
- [ ] dados de teste sintéticos ou autorização documentada;
- [ ] fluxo de suporte e canal de incidente testados;
- [ ] rollback ensaiado.

## Segurança e privacidade

- [ ] CI verde na versão candidata;
- [ ] Security Gate verde;
- [ ] teste de autorização negativa por perfil;
- [ ] secrets fora do código;
- [ ] retenção e finalidade aprovadas;
- [ ] procedimento de titular e opt-out testado;
- [ ] nenhuma escrita IXC/SGP habilitada sem homologação.

## Continuidade e observabilidade

- [ ] backup verificado;
- [ ] restauração ensaiada;
- [ ] RTO/RPO registrados;
- [ ] request/correlation ID disponível;
- [ ] logs sem Authorization, cookies, body ou dados pessoais;
- [ ] alertas e escalonamento testados.

## Aprovação

- [ ] responsável técnico;
- [ ] responsável operacional;
- [ ] representante municipal;
- [ ] representante do provedor;
- [ ] aprovação de segurança/privacidade;
- [ ] decisão: aprovado / aprovado com risco / rejeitado;
- [ ] data de expiração da aprovação.
