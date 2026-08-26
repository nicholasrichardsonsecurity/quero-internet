# Estratégia de Deploy — Quero Internet GovTech

## Decisão atual

O Vercel foi removido do fluxo técnico obrigatório do projeto. O repositório e a arquitetura não dependem de Vercel para build, homologação ou produção.

## Fonte de verdade

O gate de engenharia passa a ser:

1. GitHub Pull Request
2. CI
3. Security Gate
4. Build de imagens Docker
5. Homologação self-hosted
6. Produção após gates próprios de release

Checks externos de plataformas de hospedagem não determinam a saúde do código.

## Arquitetura operacional alvo

```text
GitHub
  -> CI + Security Gate
  -> Container Web (Next.js)
  -> Container API (NestJS)
  -> Worker
  -> PostgreSQL
  -> Redis
  -> Storage S3-compatible
  -> Reverse proxy / TLS
  -> Observabilidade
```

## Frontend

O Next.js deve continuar portável e sem acoplamento a recursos proprietários de uma única plataforma de hospedagem. `AUTH_API_URL` é configuração server-side e deverá apontar para a API do ambiente correspondente.

## Homologação

A homologação será baseada em containers e infraestrutura controlada pelo projeto. O ambiente deve possuir variáveis e secrets próprios, TLS, logs, health checks e política de rollback.

## Produção

Nenhum deploy automático em produção será habilitado apenas porque um commit chegou à `main`. Release de produção dependerá de gates explícitos, versionamento, migration review, backup/restore readiness, segurança e rollback.

## Vercel

- não é dependência da arquitetura;
- não é gate obrigatório de merge;
- não deve receber configuração local versionada (`.vercel/` está ignorado);
- integração Git externa deve permanecer desconectada enquanto essa decisão estiver vigente;
- eventual reintrodução futura exige ADR e justificativa de custo/benefício.
