# Especificação do teste E2E mínimo

## Objetivo

Provar a jornada operacional principal com dados sintéticos, autorização contextual e estados persistidos.

## Fluxo

1. preparar tenant, município, provedor, usuário e programa sintéticos;
2. autenticar um operador municipal;
3. confirmar que o contexto autorizado é retornado;
4. cadastrar beneficiário sem persistir documento bruto;
5. criar solicitação no programa ativo;
6. revisar elegibilidade com decisão humana e justificativa;
7. encaminhar ao provedor participante;
8. aceitar ou recusar no contexto do provedor;
9. registrar viabilidade técnica;
10. criar ordem de instalação e avançar os estados válidos;
11. registrar ativação;
12. consultar serviço ativo;
13. consultar dashboard operacional agregado;
14. verificar auditoria e request/correlation IDs;
15. tentar acesso cruzado entre tenants e confirmar rejeição.

## Casos negativos obrigatórios

- token ausente, expirado e revogado;
- papel sem permissão;
- tenant fora da sessão;
- transição de estado inválida;
- documento bruto enviado ao endpoint;
- tentativa de escrita em integração externa;
- reexecução com mesma chave de idempotência.

## Evidências

Registrar versão, dataset, horários, request IDs, resultados, falhas, screenshots ou logs sanitizados e responsável pela execução. O teste só conta como evidência quando executado em homologação isolada.
