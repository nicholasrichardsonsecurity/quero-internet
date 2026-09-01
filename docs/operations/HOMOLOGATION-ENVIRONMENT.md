# Ambiente de homologação

## Objetivo

Definir um ambiente reproduzível e isolado para validar o piloto sem dados reais.

## Requisitos

- PostgreSQL, Redis e storage S3-compatible isolados;
- versão de imagem fixada por digest ou versão aprovada;
- secrets fornecidos pelo ambiente, nunca pelo repositório;
- TLS no acesso externo;
- rede restrita e allowlist para integrações;
- logs com acesso mínimo necessário;
- backup separado do ambiente principal;
- dados sintéticos identificados e não reidentificáveis;
- migrations aplicadas de forma automatizada;
- health e readiness monitorados.

## Variáveis e segredos

O arquivo infra/docker/docker-compose.yml é referência local e contém credenciais de desenvolvimento. Ele não deve ser usado diretamente em homologação ou produção.

Na homologação, definir DATABASE_URL, credenciais do storage, chaves de sessão e credenciais de fornecedores por secret manager. Nenhum valor real deve ser commitado.

## Critérios de aceite

- ambiente sobe a partir de configuração versionada;
- serviços respondem aos health checks;
- banco inicia na versão esperada;
- migrations são reproduzíveis;
- acesso externo não expõe PostgreSQL, Redis, storage ou console administrativo;
- logs não contêm Authorization, cookies, payloads ou dados pessoais;
- rollback da versão candidata é possível.

## Estado

Este documento define o alvo. O ambiente de homologação ainda precisa ser provisionado, validado e anexado a uma release candidata.
