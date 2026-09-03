# Instalação e operação

Este guia cobre o caminho do clone até a validação local e a homologação isolada do Quero Internet GovTech.

## 1. Pré-requisitos

- Git com acesso ao repositório;
- Node.js 22.x;
- pnpm 10.14.x (o projeto fixa `pnpm@10.14.0`);
- Docker Engine e Docker Compose;
- OpenSSL para gerar secrets;
- acesso a PostgreSQL, Redis e MinIO/S3-compatible no ambiente escolhido.

Confira as versões:

```bash
node --version
pnpm --version
docker --version
docker compose version
```

## 2. Clonar e instalar

```bash
git clone git@github.com:nicholasrichardsonsecurity/quero-internet.git
cd quero-internet
pnpm install --frozen-lockfile=false
pnpm approve-builds
```

Use `pnpm approve-builds` somente para dependências que o time reconhece e precisa executar durante a instalação. Nunca aprove scripts desconhecidos sem revisão.

## 3. Configurar o ambiente local

```bash
cp .env.example .env
```

Edite `.env` com os serviços locais. O arquivo `.env` é ignorado pelo Git e nunca deve conter credenciais de homologação ou produção.

Suba as dependências locais:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis minio
```

Depois configure `DATABASE_URL` para o PostgreSQL local e execute:

```bash
pnpm db:generate
pnpm db:validate
pnpm db:migrate:deploy
```

## 4. Verificar o código

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Para desenvolvimento:

```bash
pnpm dev
```

Consulte as portas e variáveis de cada aplicação antes de expor serviços fora da máquina local.

## 5. Homologação isolada

Homologação não reutiliza o `.env` local nem dados reais.

```bash
cp infra/docker/.env.homolog.example infra/docker/.env.homolog.local
sed -i "s|^HOMOLOG_POSTGRES_PASSWORD=.*|HOMOLOG_POSTGRES_PASSWORD=$(openssl rand -hex 32)|" infra/docker/.env.homolog.local
sed -i "s|^HOMOLOG_REDIS_PASSWORD=.*|HOMOLOG_REDIS_PASSWORD=$(openssl rand -hex 32)|" infra/docker/.env.homolog.local
sed -i "s|^HOMOLOG_MINIO_ROOT_USER=.*|HOMOLOG_MINIO_ROOT_USER=homologadmin$(openssl rand -hex 4)|" infra/docker/.env.homolog.local
sed -i "s|^HOMOLOG_MINIO_ROOT_PASSWORD=.*|HOMOLOG_MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)|" infra/docker/.env.homolog.local
sed -i "s|^HOMOLOG_SEED_PASSWORD=.*|HOMOLOG_SEED_PASSWORD=$(openssl rand -hex 32)|" infra/docker/.env.homolog.local
chmod 600 infra/docker/.env.homolog.local
set -a; . infra/docker/.env.homolog.local; set +a
bash scripts/verify-homologation-config.sh
docker compose --env-file infra/docker/.env.homolog.local -f infra/docker/docker-compose.homolog.yml up -d postgres redis minio
```

O compose de homologação usa rede interna e não publica PostgreSQL, Redis ou MinIO no host. A API deve ser executada em uma rede autorizada, com `DATABASE_URL` apontando para o serviço `postgres`, e nunca deve ser conectada a um banco de outro ambiente.

Para aplicar o schema:

```bash
DATABASE_URL="postgresql://${HOMOLOG_POSTGRES_USER}:${HOMOLOG_POSTGRES_PASSWORD}@postgres:5432/${HOMOLOG_POSTGRES_DB}" pnpm db:migrate:deploy
```

Quando a API estiver disponível:

```bash
APP_ENV=homolog ALLOW_SYNTHETIC_SEED=true pnpm --filter @quero-internet/database db:seed:homolog
HOMOLOG_API_URL=https://homolog.example scripts/homologation-smoke.sh
```

Use somente dataset sintético. O seed de homologação não é mecanismo de carga de produção.

## 6. Operação segura

- registre commit, digest das imagens, executor, horário, dataset e resultados;
- não registre secrets, cookies, Authorization, documentos brutos ou payloads pessoais;
- valide migrations antes de iniciar a aplicação;
- faça backup/restore antes do gate de piloto;
- mantenha rollback da versão candidata documentado;
- não publique portas de banco, Redis ou storage;
- não altere containers, volumes ou redes de outros projetos, especialmente LoopClub.

Para encerrar somente o ambiente de homologação:

```bash
docker compose --env-file infra/docker/.env.homolog.local -f infra/docker/docker-compose.homolog.yml down
```

Esse comando não remove volumes. A remoção de volumes exige decisão operacional explícita, pois destrói os dados do ambiente.

## Referências

- [`docs/architecture/FOUNDATION.md`](../architecture/FOUNDATION.md)
- [`docs/operations/HOMOLOGATION-ENVIRONMENT.md`](HOMOLOGATION-ENVIRONMENT.md)
- [`docs/operations/HOMOLOGATION-EXECUTION.md`](HOMOLOGATION-EXECUTION.md)
- [`docs/operations/E2E-SMOKE-SPEC.md`](E2E-SMOKE-SPEC.md)
- [`docs/operations/PILOT-GATE.md`](PILOT-GATE.md)

## Fluxo obrigatório de trabalho: Issue → branch → PR → deploy

Este é o padrão oficial do projeto para qualquer **correção**, **melhoria** ou **nova função**. Ele se aplica a pessoas e agentes de qualquer modelo.

### 1. Abrir a Issue antes de implementar

Toda tarefa deve ter uma Issue no repositório, com contexto, objetivo, escopo, fora de escopo, dependências, riscos e critérios de aceite verificáveis. Não iniciar uma mudança relevante sem Issue.

Issues de referência desta frente:

- [#44 — Publicar a API em api.querointernet.aplivora.com.br](https://github.com/nicholasrichardsonsecurity/quero-internet/issues/44)
- [#45 — Tornar o deploy da API de homologação reproduzível e auditável](https://github.com/nicholasrichardsonsecurity/quero-internet/issues/45)
- [#46 — Governança: fluxo obrigatório de Issues, branches, PRs e deploys](https://github.com/nicholasrichardsonsecurity/quero-internet/issues/46)
- [#47 — Documentar instalação, operação e identidade oficial](https://github.com/nicholasrichardsonsecurity/quero-internet/issues/47)

### 2. Criar uma branch vinculada

Uma tarefa por branch, criada a partir da base atualizada. Use um dos padrões:

- `fix/issue-<numero>-descricao-curta`
- `feat/issue-<numero>-descricao-curta`
- `docs/issue-<numero>-descricao-curta`
- `ops/issue-<numero>-descricao-curta`

Não fazer commit direto em `main` e não usar uma branch de outra tarefa.

### 3. Trabalhar por Pull Request

Toda alteração deve chegar à base por PR. A descrição do PR deve conter:

- `Closes #<numero>` (ou `Fixes #<numero>` quando for correção);
- resumo da mudança e arquivos afetados;
- critérios de aceite atendidos;
- testes e evidências executados;
- impacto de segurança, privacidade e operação;
- plano de deploy e rollback;
- secrets redigidos e nunca incluídos no código, Issue, PR, log ou screenshot.

O PR deve permanecer bloqueado até a CI ficar verde e as revisões obrigatórias serem concluídas.

### 4. Fazer deploy somente pelo fluxo aprovado

Deploy em homologação ou produção só pode ocorrer com PR aprovado e mergeado, usando o commit SHA que foi revisado. Registrar ambiente, SHA, imagem/digest, data, operador, resultado dos health checks e referência da Issue/PR.

Em caso de hotfix, abrir a Issue imediatamente, registrar a justificativa e ainda assim abrir o PR correspondente. A urgência não elimina revisão, CI, evidência ou rollback.

### 5. Definition of Done

Uma tarefa só está concluída quando:

- Issue, branch e PR estão vinculados;
- critérios de aceite foram verificados;
- CI e Security Gate estão verdes;
- documentação e variáveis de ambiente foram atualizadas;
- não há secrets ou dados reais nas alterações;
- deploy foi validado no ambiente correto;
- evidências e rollback estão registrados;
- a Issue foi fechada pelo PR ou manualmente após confirmação.

Qualquer agente deve consultar esta seção, a Issue vinculada e o PR antes de modificar o projeto.
