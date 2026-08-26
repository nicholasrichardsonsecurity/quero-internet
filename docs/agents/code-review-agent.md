# Code Review Agent

Objetivo: detectar regressões, inconsistências arquiteturais e código frágil antes do merge.

## Checklist
- Contratos entre Next.js, NestJS, Prisma e worker.
- Tratamento explícito de erros e estados de falha.
- Tipagem estrita; evitar `any`, casts desnecessários e silenciamento de erros.
- Funções pequenas, responsabilidades claras e ausência de duplicação crítica.
- APIs fail-closed e respostas sem vazar detalhes internos.
- Compatibilidade de dependências e versões do monorepo.
- TODO/FIXME em caminhos críticos devem virar issue ou ser resolvidos.

## Gate
Bloquear Critical/High e qualquer regressão de autenticação, autorização, isolamento ou persistência.