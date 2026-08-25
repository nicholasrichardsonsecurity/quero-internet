# Quero Internet GovTech

Plataforma pública multiempresa para programas de conectividade e inclusão digital, conectando municípios, beneficiários elegíveis e provedores locais.

## Estado
Fase 1 — Fundação Técnica.

## Stack inicial
- NestJS API
- Next.js Web
- Worker TypeScript
- PostgreSQL
- Redis
- MinIO/S3
- pnpm + Turborepo

## Desenvolvimento local
Após instalar Node 22+ e pnpm 10.14.x:

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
pnpm dev
```

API prevista em `http://localhost:3001` com `/health` e `/ready`.
