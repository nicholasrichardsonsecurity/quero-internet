# Exercício de backup e restauração

## Objetivo

Provar que o banco pode ser restaurado em ambiente isolado dentro do RTO/RPO aprovados.

## Pré-condições

- ambiente de homologação separado;
- backup criptografado e com acesso restrito;
- dataset sintético identificado;
- janela de teste aprovada;
- responsável e observador registrados.

## Procedimento

1. registrar horário e versão da aplicação;
2. gerar ou selecionar o backup candidato;
3. verificar integridade e tamanho do artefato;
4. restaurar em banco isolado, sem alterar a origem;
5. aplicar migrations até a versão candidata;
6. executar os comandos db:validate, db:generate e smoke tests;
7. conferir contagens e invariantes do dataset sintético;
8. registrar RTO, RPO, falhas e evidências;
9. destruir o ambiente temporário conforme política de retenção;
10. abrir ação corretiva para qualquer divergência.

## Critérios de sucesso

- restauração sem erro;
- migrations aplicadas;
- health e readiness aprovados;
- jornada sintética mínima executada;
- RTO/RPO dentro do limite aprovado;
- nenhuma credencial ou dado real exposto nos artefatos.

Até que este exercício seja executado e anexado a uma release, o Gate de Piloto permanece bloqueado.
