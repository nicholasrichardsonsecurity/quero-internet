# Ambiente de homologação

## Objetivo

Definir um ambiente reproduzível, isolado e sem dados reais para validar o piloto controlado.

## Requisitos

- PostgreSQL, Redis e storage S3-compatible isolados;
- imagens verificadas e, antes de produção, fixadas por digest;
- secrets fornecidos pelo ambiente, nunca pelo repositório;
- TLS e allowlist no acesso externo;
- logs com acesso mínimo necessário;
- backup separado e restauração testável;
- dados sintéticos identificados e não reidentificáveis;
- migrations aplicadas de forma automatizada;
- health e readiness monitorados.

## Topologia

`infra/docker/docker-compose.homolog.yml` cria o projeto `quero-internet-homolog`, a rede interna `homolog_internal` e volumes próprios para PostgreSQL, Redis e MinIO. Nenhum desses serviços publica porta no host.

A API deve ser conectada à rede interna por mecanismo controlado do ambiente de hospedagem. Se for necessário um túnel para operação administrativa, ele deve escutar somente em loopback, ter escopo temporário e ser removido ao final.

Essa separação permite coexistência segura com outros produtos no mesmo host. Não reutilizar redes, volumes, portas ou containers de outro projeto.

## Variáveis e secrets

Use `infra/docker/.env.homolog.example` como modelo e crie `infra/docker/.env.homolog.local` fora do Git. Substitua todos os placeholders por valores aleatórios, aplique `chmod 600` e valide com `scripts/verify-homologation-config.sh`.

Defina `DATABASE_URL`, credenciais do Redis, endpoint/bucket do storage, chaves de sessão e credenciais de fornecedores no ambiente da API. Nenhum secret real deve ser commitado.

## Critérios de aceite

- ambiente sobe a partir de configuração versionada;
- imagens são acessíveis e a versão candidata fica registrada;
- banco inicia na versão esperada;
- migrations são reproduzíveis;
- seed contém apenas dados sintéticos;
- acesso externo não expõe PostgreSQL, Redis, storage ou console administrativo;
- logs não contêm Authorization, cookies, payloads ou dados pessoais;
- health, readiness e métricas respondem;
- backup/restore e rollback são executáveis.

## Estado

A configuração de homologação foi provisionada e validada no host de execução, com PostgreSQL, Redis e MinIO em rede interna isolada e migrations do schema aplicadas. O ambiente ainda não representa aprovação de piloto público ou produção: faltam evidências completas de smoke/E2E, backup/restore, operação, segurança, privacidade e aprovação formal do gate.