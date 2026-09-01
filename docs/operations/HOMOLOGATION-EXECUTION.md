# Execução da homologação

## Preparação

1. copiar infra/docker/.env.homolog.example para infra/docker/.env.homolog.local;
2. substituir todos os valores de exemplo por secrets aleatórios;
3. manter o arquivo local fora do Git;
4. executar scripts/verify-homologation-config.sh;
5. iniciar os serviços com o compose de homologação;
6. aplicar migrations pela pipeline ou por operador autorizado;
7. executar `APP_ENV=homolog ALLOW_SYNTHETIC_SEED=true pnpm --filter @quero-internet/database db:seed:homolog` com senha fornecida por secret manager;
8. executar `HOMOLOG_API_URL=https://... scripts/homologation-smoke.sh`;
9. conectar a API somente à rede interna;
10. executar o E2E definido em E2E-SMOKE-SPEC.md;
11. executar o exercício de backup/restauração;
12. preencher PILOT-EVIDENCE-RECORD.md;

## Restrições

O compose de homologação não publica portas de PostgreSQL, Redis ou MinIO no host. O acesso deve ocorrer por serviços autorizados na rede interna ou por túnel administrativo controlado.

A API, proxy TLS e observabilidade ainda dependem do ambiente de hospedagem escolhido. Este arquivo não é uma implantação de produção.

## Evidência

Registrar commit, digest das imagens, horários, executor, dataset sintético, resultados de health/readiness, IDs de requisição e falhas. Não registrar secrets.
